import { useEffect, useMemo, useState } from 'react'
import type { EncyclopediaBag, PinnedBag } from '../../types'
import { inferAngleMap, photoUrl } from '../../bagPhotos'

const BASE = import.meta.env.BASE_URL
const MAX_PINS = 4

/* ────────────────────────────────────────────────────────────────────
   SettingsForm — admin surface for site-wide settings Parker controls.

   Today: managing the up-to-4 pinned bags shown on the landing page's
   visitor view. Persistence is mocked (preview the JSON to paste into
   public/data/pins.json) until the Worker is wired.
   ──────────────────────────────────────────────────────────────────── */

export default function SettingsForm({ password: _password }: { password: string }) {
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
  const photos = bag?.referencePhotos ?? (bag?.referencePhoto ? [bag.referencePhoto] : [])
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
