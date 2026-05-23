import { useEffect, useState } from 'react'
import type { CategoryVisibility } from '../../types'
import { DEFAULT_VISIBILITY } from '../../types'

const BASE = import.meta.env.BASE_URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL

export default function SettingsForm({ password }: { password: string }) {
  return (
    <div className="space-y-10">
      <VisibilitySection password={password} />
    </div>
  )
}

const CATEGORY_LABELS: { key: keyof CategoryVisibility; label: string; blurb: string }[] = [
  {
    key: 'state',
    label: 'State Bags',
    blurb: 'The 50-state collection, one design per locale.',
  },
  {
    key: 'special',
    label: 'Special Editions',
    blurb: 'Themed bags such as pickle, sardine, cheese, and wine.',
  },
  {
    key: 'standard',
    label: 'Standard Bags',
    blurb: 'The everyday lineup of insulated, canvas, and washable paper.',
  },
]

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; commitUrl?: string; jsonFallback?: string }
  | { kind: 'error'; message: string }

function VisibilitySection({ password }: { password: string }) {
  const [initial, setInitial] = useState<CategoryVisibility | null>(null)
  const [visibility, setVisibility] = useState<CategoryVisibility>(DEFAULT_VISIBILITY)
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' })

  useEffect(() => {
    fetch(`${BASE}data/visibility.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? (r.json() as Promise<CategoryVisibility>) : DEFAULT_VISIBILITY))
      .then((v) => {
        const merged = { ...DEFAULT_VISIBILITY, ...v }
        setVisibility(merged)
        setInitial(merged)
      })
      .catch(() => {
        setVisibility(DEFAULT_VISIBILITY)
        setInitial(DEFAULT_VISIBILITY)
      })
  }, [])

  const dirty =
    initial !== null &&
    (visibility.state !== initial.state ||
      visibility.special !== initial.special ||
      visibility.standard !== initial.standard)

  function toggle(key: keyof CategoryVisibility) {
    setVisibility((v) => ({ ...v, [key]: !v[key] }))
    if (status.kind === 'saved' || status.kind === 'error') {
      setStatus({ kind: 'idle' })
    }
  }

  async function handleSave() {
    if (!dirty || status.kind === 'saving') return

    if (!WORKER_URL) {
      setStatus({
        kind: 'saved',
        jsonFallback: JSON.stringify(visibility, null, 2),
      })
      setInitial(visibility)
      return
    }

    setStatus({ kind: 'saving' })
    try {
      const res = await fetch(`${WORKER_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, key: 'visibility', value: visibility }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        commitUrl?: string
      }
      if (!res.ok || !data.ok) {
        setStatus({ kind: 'error', message: data.error ?? `Save failed (${res.status})` })
        return
      }
      setStatus({ kind: 'saved', commitUrl: data.commitUrl })
      setInitial(visibility)
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message })
    }
  }

  return (
    <section>
      <div className="mb-4">
        <h3 className="font-[var(--tj-body)] tracking-[0.22em] text-[0.75rem] uppercase font-semibold mb-1">
          Category Visibility
        </h3>
        <p className="font-[var(--tj-body)] italic text-sm opacity-75">
          Pick which categories appear in your Pantry, the progress row, and
          the Log-a-Bag picker. The Encyclopedia ignores this setting and
          always shows every Trader Joe's bag.
        </p>
      </div>

      <ul className="space-y-2">
        {CATEGORY_LABELS.map(({ key, label, blurb }) => {
          const on = visibility[key]
          return (
            <li key={key}>
              <label className="flex items-start gap-3 border-2 border-[var(--tj-ink)]/40 bg-white p-3 cursor-pointer hover:border-[var(--tj-ink)] transition-colors">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(key)}
                  className="mt-1 w-5 h-5 accent-[var(--tj-red)] cursor-pointer"
                />
                <span className="flex-1">
                  <span className="block font-[var(--tj-body)] font-bold tracking-[0.05em]">
                    {label}{' '}
                    <span
                      className={`ml-1 font-[var(--tj-body)] tracking-[0.18em] text-[0.6rem] uppercase font-semibold ${on ? 'text-[var(--tj-red)]/80' : 'opacity-50'}`}
                    >
                      {on ? 'Shown' : 'Hidden'}
                    </span>
                  </span>
                  <span className="block font-[var(--tj-body)] italic text-sm opacity-70 mt-0.5">
                    {blurb}
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {status.kind === 'error' && (
        <div className="mt-4 border-2 border-[var(--tj-red)] bg-[var(--tj-red)]/10 px-4 py-3 text-sm">
          <strong className="font-[var(--tj-body)] tracking-[0.15em] text-xs uppercase block mb-1">
            Save failed
          </strong>
          <span className="italic opacity-90">{status.message}</span>
        </div>
      )}

      {status.kind === 'saved' && status.jsonFallback && (
        <div className="mt-4 border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] p-4 text-sm space-y-2">
          <p className="italic opacity-80">
            Worker isn't configured. Paste the JSON below into{' '}
            <code className="bg-[var(--tj-kraft)]/40 px-1.5 py-0.5">public/data/visibility.json</code>{' '}
            and commit.
          </p>
          <pre className="bg-white border border-[var(--tj-ink)] p-3 text-xs overflow-x-auto font-mono">
            {status.jsonFallback}
          </pre>
        </div>
      )}

      {status.kind === 'saved' && !status.jsonFallback && (
        <p className="mt-4 italic text-sm opacity-80">
          Saved.{' '}
          {status.commitUrl && (
            <a
              href={status.commitUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-[var(--tj-red)]"
            >
              View the commit →
            </a>
          )}
        </p>
      )}

      <div className="pt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || status.kind === 'saving'}
          className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.kind === 'saving' ? 'Saving…' : 'Save Visibility'}
        </button>
      </div>
    </section>
  )
}
