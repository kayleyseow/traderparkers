import { useEffect, useMemo, useState } from 'react'
import type { CategoryVisibility, EncyclopediaBag, PinnedBag } from '../../types'
import { DEFAULT_VISIBILITY } from '../../types'
import { defaultReferencePhotos, inferAngleMap, photoUrl } from '../../bagPhotos'

const BASE = import.meta.env.BASE_URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL
const MAX_PINS = 4

/* ────────────────────────────────────────────────────────────────────
   SettingsForm — admin surface for site-wide settings Parker controls.

   Today: managing the up-to-4 pinned bags shown on the landing page's
   visitor view. Persistence is mocked (preview the JSON to paste into
   public/data/pins.json) until the Worker is wired.
   ──────────────────────────────────────────────────────────────────── */

export default function SettingsForm({ password }: { password: string }) {
  const [encyclopedia, setEncyclopedia] = useState<EncyclopediaBag[] | null>(null)
  const [pins, setPins] = useState<PinnedBag[]>([])
  const [submitted, setSubmitted] = useState<PinnedBag[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch(`${BASE}data/encyclopedia.json`)
      .then((r) => r.json() as Promise<EncyclopediaBag[]>)
      .then(setEncyclopedia)
      .catch(() => setEncyclopedia([]))
    fetch(`${BASE}data/pins.json`)
      .then((r) => r.json() as Promise<PinnedBag[]>)
      .then(setPins)
      .catch(() => {
        /* fine; treat missing file as empty */
      })
  }, [])

  const byId = useMemo(() => {
    const m = new Map<string, EncyclopediaBag>()
    if (encyclopedia) for (const b of encyclopedia) m.set(b.id, b)
    return m
  }, [encyclopedia])

  const pinnedIds = useMemo(() => new Set(pins.map((p) => p.encyclopediaId)), [pins])

  const suggestions = useMemo(() => {
    if (!encyclopedia) return []
    const q = query.trim().toLowerCase()
    if (!q) return []
    return encyclopedia
      .filter((b) => !pinnedIds.has(b.id))
      .filter((b) => {
        const haystack = `${b.name} ${b.region ?? ''} ${b.state ?? ''} ${b.id}`.toLowerCase()
        return haystack.includes(q)
      })
      .slice(0, 8)
  }, [encyclopedia, pinnedIds, query])

  const atCap = pins.length >= MAX_PINS

  function addPin(id: string) {
    if (atCap || pinnedIds.has(id)) return
    setPins((prev) => [...prev, { encyclopediaId: id }])
    setQuery('')
  }

  function removePin(id: string) {
    setPins((prev) => prev.filter((p) => p.encyclopediaId !== id))
  }

  function setNote(id: string, note: string) {
    setPins((prev) =>
      prev.map((p) => (p.encyclopediaId === id ? { ...p, note: note || undefined } : p)),
    )
  }

  function move(index: number, dir: -1 | 1) {
    setPins((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Normalize: drop empty notes so the JSON is minimal.
    const cleaned = pins.map((p) => (p.note ? p : { encyclopediaId: p.encyclopediaId }))
    // TODO: POST to Worker /settings/pins. For now, preview the payload.
    setSubmitted(cleaned)
  }

  if (encyclopedia === null) {
    return <p className="italic opacity-60">Loading bag list…</p>
  }

  if (submitted) {
    return <SubmittedPreview payload={submitted} onReset={() => setSubmitted(null)} />
  }

  return (
    <div className="space-y-10">
      <VisibilitySection password={password} />

      <form
        onSubmit={handleSubmit}
        className="space-y-6 border-t-2 border-[var(--tj-ink)]/20 pt-8"
      >
      <div>
        <h3 className="font-[var(--tj-body)] tracking-[0.22em] text-[0.75rem] uppercase font-semibold mb-1">
          Pinned Favorites
        </h3>
        <p className="font-[var(--tj-body)] italic text-sm opacity-75">
          Up to {MAX_PINS} bags. These show on the landing page's visitor view
          as a small "Parker's Favorites" row.
        </p>
      </div>

      {/* Current pin list */}
      {pins.length === 0 ? (
        <p className="border-2 border-dashed border-[var(--tj-ink)]/40 px-4 py-6 text-center italic opacity-70">
          No pins yet. Search below to add one.
        </p>
      ) : (
        <ul className="space-y-3">
          {pins.map((pin, i) => (
            <PinRow
              key={pin.encyclopediaId}
              pin={pin}
              bag={byId.get(pin.encyclopediaId)}
              isFirst={i === 0}
              isLast={i === pins.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onRemove={() => removePin(pin.encyclopediaId)}
              onNoteChange={(note) => setNote(pin.encyclopediaId, note)}
            />
          ))}
        </ul>
      )}

      {/* Picker */}
      <div>
        <label className="block">
          <span className="font-[var(--tj-body)] tracking-[0.2em] text-[0.7rem] uppercase block mb-1">
            Add a Pin
            {atCap && (
              <span className="ml-2 normal-case tracking-normal italic text-xs opacity-70">
                (at {MAX_PINS}/{MAX_PINS} — remove one first)
              </span>
            )}
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={atCap}
            placeholder="Search by name, state, or ID…"
            className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none disabled:opacity-50 disabled:bg-[var(--tj-cream)]"
          />
        </label>
        {suggestions.length > 0 && (
          <ul className="border-2 border-[var(--tj-ink)] border-t-0 divide-y divide-[var(--tj-ink)]/15 bg-white max-h-72 overflow-auto">
            {suggestions.map((bag) => (
              <li key={bag.id}>
                <button
                  type="button"
                  onClick={() => addPin(bag.id)}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--tj-ink)]/[0.06] transition-colors"
                >
                  <span className="font-[var(--tj-body)] font-bold">
                    {bag.region ?? bag.name}
                  </span>
                  {bag.state && (
                    <span className="ml-2 font-[var(--tj-body)] tracking-[0.18em] text-[0.6rem] uppercase opacity-60">
                      {bag.state}
                    </span>
                  )}
                  <span className="ml-2 font-mono text-xs opacity-50">{bag.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-2 flex items-center justify-end">
        <button
          type="submit"
          className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors"
        >
          Preview pins.json
        </button>
      </div>
      </form>
    </div>
  )
}

/* ──────────────────────────  Pieces  ────────────────────────── */

function PinRow({
  pin,
  bag,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onNoteChange,
}: {
  pin: PinnedBag
  bag: EncyclopediaBag | undefined
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onNoteChange: (note: string) => void
}) {
  const photos = bag ? defaultReferencePhotos(bag) : []
  const front = photos.length > 0 ? inferAngleMap(photos).front ?? photos[0] : undefined
  const displayName = bag?.region ?? bag?.name ?? pin.encyclopediaId

  return (
    <li className="border-2 border-[var(--tj-ink)]/40 bg-white p-3 flex gap-3">
      <div className="w-16 h-20 shrink-0 bg-[var(--tj-kraft)]/30 border border-[var(--tj-ink)]/30 overflow-hidden">
        {front ? (
          <img
            src={photoUrl(front)}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs italic opacity-40">
            no photo
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-[var(--tj-body)] font-bold leading-tight truncate">
            {displayName}
          </p>
          <span className="font-mono text-xs opacity-50 shrink-0">{pin.encyclopediaId}</span>
        </div>
        <input
          type="text"
          value={pin.note ?? ''}
          onChange={(e) => onNoteChange(e.target.value)}
          maxLength={120}
          placeholder="Optional note (e.g. “my first state bag”)"
          className="w-full mt-1 border border-[var(--tj-ink)]/40 bg-[var(--tj-cream)]/40 px-2 py-1 font-serif text-sm outline-none focus:bg-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Move up"
          className="font-[var(--tj-body)] tracking-[0.15em] text-[0.6rem] uppercase font-semibold border border-[var(--tj-ink)] px-2 py-0.5 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--tj-ink)]"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Move down"
          className="font-[var(--tj-body)] tracking-[0.15em] text-[0.6rem] uppercase font-semibold border border-[var(--tj-ink)] px-2 py-0.5 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--tj-ink)]"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove pin"
          className="mt-auto font-[var(--tj-body)] tracking-[0.15em] text-[0.6rem] uppercase font-semibold border border-[var(--tj-red)] text-[var(--tj-red)] px-2 py-0.5 hover:bg-[var(--tj-red)] hover:text-[var(--tj-cream)] transition-colors"
        >
          Remove
        </button>
      </div>
    </li>
  )
}

/* ──────────────────────────  Visibility section  ─────────────────
   Four toggles controlling whether each bag category appears in the
   public encyclopedia, the Pantry stats row, and the Log-a-Bag picker.
   Saves go through the Worker's /settings endpoint; if the Worker isn't
   configured, we fall back to showing the JSON for manual commit. */

const CATEGORY_LABELS: { key: keyof CategoryVisibility; label: string; blurb: string }[] = [
  {
    key: 'state',
    label: 'State Bags',
    blurb: 'The 50-state collection — one design per locale.',
  },
  {
    key: 'special',
    label: 'Special Editions',
    blurb: 'Themed bags — pickle, sardine, cheese, wine.',
  },
  {
    key: 'seasonal',
    label: 'Seasonal',
    blurb: 'Holiday and seasonal releases that change year to year.',
  },
  {
    key: 'standard',
    label: 'Standard Bags',
    blurb: 'The everyday lineup — insulated, canvas, washable paper.',
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
    fetch(`${BASE}data/visibility.json`)
      .then((r) => (r.ok ? (r.json() as Promise<CategoryVisibility>) : DEFAULT_VISIBILITY))
      .then((v) => {
        // Merge with defaults so a partial file still resolves all three keys.
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
      visibility.seasonal !== initial.seasonal ||
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
          Decide which categories appear on the public encyclopedia, the
          Pantry stats row, and the Log-a-Bag picker.
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
            Worker isn't configured — paste the JSON below into{' '}
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

function SubmittedPreview({
  payload,
  onReset,
}: {
  payload: PinnedBag[]
  onReset: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="border-2 border-[var(--tj-ink)] bg-[var(--tj-kraft)] p-5 text-center">
        <p
          className="text-3xl text-[var(--tj-red)] mb-1"
          style={{ fontFamily: 'var(--tj-script)' }}
        >
          Preview ready
        </p>
        <p className="font-[var(--tj-body)] italic text-sm opacity-80">
          Worker isn't wired yet — paste the JSON below into
          <code className="mx-1">public/data/pins.json</code> and commit.
        </p>
      </div>
      <pre className="font-mono text-xs bg-white/80 border-2 border-[var(--tj-ink)]/30 p-3 overflow-x-auto whitespace-pre">
        {JSON.stringify(payload, null, 2)}
      </pre>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors"
        >
          Keep Editing
        </button>
      </div>
    </div>
  )
}
