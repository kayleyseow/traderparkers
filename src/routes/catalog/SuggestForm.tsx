import { useEffect, useRef, useState } from 'react'
import type { BagType } from '../../types'
import { US_LOCALES } from '../../usLocales'

const WORKER_URL = import.meta.env.VITE_WORKER_URL
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'submitted'; issueUrl?: string }
  | { kind: 'error'; message: string }

type FormState = {
  name: string
  type: BagType | ''
  stateCode: string
  region: string
  year: string
  notes: string
  contact: string
}

const EMPTY: FormState = {
  name: '',
  type: '',
  stateCode: '',
  region: '',
  year: '',
  notes: '',
  contact: '',
}

export default function SuggestForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const { token, containerRef, reset: resetTurnstile } = useTurnstile(TURNSTILE_SITE_KEY)

  // Configuration check: if either env var is missing, show a friendly placeholder
  // instead of a broken form. This is the state pre-Worker-deploy.
  if (!WORKER_URL || !TURNSTILE_SITE_KEY) {
    return (
      <div className="border-2 border-dashed border-[var(--tj-ink)]/40 bg-[var(--tj-kraft)]/10 p-6 text-center max-w-2xl mx-auto">
        <p className="font-[var(--tj-body)] italic text-sm opacity-75">
          The Suggest-a-Bag form will appear here once the Cloudflare Worker is
          configured. In the meantime, spotted a missing bag? Tell Parker directly.
        </p>
      </div>
    )
  }

  const valid = form.name.trim().length > 0 && token !== null

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || status.kind === 'submitting') return

    const locale = US_LOCALES.find((l) => l.code === form.stateCode)
    const yearNum = form.year ? Number(form.year) : undefined

    setStatus({ kind: 'submitting' })
    try {
      const res = await fetch(`${WORKER_URL}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type || undefined,
          state: locale?.name,
          stateCode: locale?.code,
          region: form.region.trim() || undefined,
          year: yearNum && Number.isFinite(yearNum) ? yearNum : undefined,
          notes: form.notes.trim() || undefined,
          submitterContact: form.contact.trim() || undefined,
          turnstileToken: token,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        issueUrl?: string
      }
      if (!res.ok || !data.ok) {
        setStatus({
          kind: 'error',
          message: data.error ?? `Submission failed (${res.status})`,
        })
        resetTurnstile()
        return
      }
      setStatus({ kind: 'submitted', issueUrl: data.issueUrl })
      setForm(EMPTY)
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message })
      resetTurnstile()
    }
  }

  if (status.kind === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto border-2 border-[var(--tj-ink)] bg-[var(--tj-kraft)] p-6 text-center">
        <p
          className="text-3xl text-[var(--tj-red)] mb-2"
          style={{ fontFamily: 'var(--tj-script)' }}
        >
          Thanks!
        </p>
        <p className="font-[var(--tj-body)] italic text-sm opacity-80">
          Your suggestion was filed. Parker will review it and add the bag to the
          catalog if it checks out.
          {status.issueUrl && (
            <>
              {' '}
              <a
                href={status.issueUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-[var(--tj-red)]"
              >
                See your suggestion →
              </a>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: 'idle' })}
          className="mt-5 font-[var(--tj-body)] tracking-[0.25em] text-[0.7rem] uppercase font-semibold border-2 border-[var(--tj-ink)] px-4 py-2 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
        >
          Suggest Another
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] p-6 md:p-8 space-y-5"
    >
      <p className="font-[var(--tj-body)] italic text-sm opacity-75 -mb-1">
        Spotted a TJ bag that's not in the catalog? Tell Parker about it. Suggestions
        get filed as a GitHub issue she'll review.
      </p>

      <Field label="Bag Name" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
          maxLength={120}
          placeholder="e.g. Wyoming, or Pickle Cotton Bag"
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Type">
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value as FormState['type'])}
            className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
          >
            <option value="">Pick a type</option>
            <option value="state">Locale (state, region, or city)</option>
            <option value="special">Special edition (themed)</option>
            <option value="seasonal">Seasonal</option>
            <option value="standard">Standard everyday bag</option>
          </select>
        </Field>

        <Field label="State (if locale-tied)">
          <select
            value={form.stateCode}
            onChange={(e) => update('stateCode', e.target.value)}
            className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
          >
            <option value="">—</option>
            {US_LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Region or City (optional)" hint="e.g. Brooklyn, Portland">
          <input
            type="text"
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
            maxLength={80}
            className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
          />
        </Field>

        <Field label="Year (optional)">
          <input
            type="number"
            inputMode="numeric"
            value={form.year}
            onChange={(e) => update('year', e.target.value)}
            min={2000}
            max={2100}
            placeholder="2024"
            className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
          />
        </Field>
      </div>

      <Field
        label="Notes"
        hint="Where you saw it, what it looks like, anything that'd help confirm it."
      >
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Saw it at the Asheville TJ's last week — yellow with a banjo on it."
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none resize-y"
        />
      </Field>

      <Field
        label="Your Contact (optional)"
        hint="Email or social handle, only if you want Parker to follow up."
      >
        <input
          type="text"
          value={form.contact}
          onChange={(e) => update('contact', e.target.value)}
          maxLength={120}
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
        />
      </Field>

      <div ref={containerRef} className="flex justify-center" />

      {status.kind === 'error' && (
        <div className="border-2 border-[var(--tj-red)] bg-[var(--tj-red)]/10 px-4 py-3 text-sm">
          <strong className="font-sans tracking-[0.15em] text-xs uppercase block mb-1">
            Submission failed
          </strong>
          <span className="italic opacity-90">{status.message}</span>
        </div>
      )}

      <div className="pt-2 flex items-center justify-end">
        <button
          type="submit"
          disabled={!valid || status.kind === 'submitting'}
          className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.kind === 'submitting' ? 'Submitting…' : 'Submit Suggestion'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-sans tracking-[0.2em] text-[0.65rem] uppercase font-semibold block mb-1">
        {label}
        {required && <span className="text-[var(--tj-red)] ml-1">*</span>}
      </span>
      {hint && <span className="block text-xs italic opacity-65 mb-2">{hint}</span>}
      {children}
    </label>
  )
}

/* ──────────────────────────  Turnstile widget hook  ──────────────── */

type TurnstileGlobal = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

function useTurnstile(siteKey: string | undefined) {
  const [token, setToken] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey) return

    if (!document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`)) {
      const script = document.createElement('script')
      script.src = TURNSTILE_SCRIPT
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    let cancelled = false
    const interval = window.setInterval(() => {
      if (cancelled) return
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (t) => setToken(t),
        'expired-callback': () => setToken(null),
        'error-callback': () => setToken(null),
      })
      window.clearInterval(interval)
    }, 100)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* widget might already be gone */
        }
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  const reset = () => {
    setToken(null)
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch {
        /* widget gone */
      }
    }
  }

  return { token, containerRef, reset }
}
