import { useEffect, useMemo, useRef, useState } from 'react'
import type { CategoryVisibility, EncyclopediaBag, PantryBag, Store } from '../../types'
import { DEFAULT_VISIBILITY } from '../../types'
import StoreSelect from './StoreSelect'

const BASE = import.meta.env.BASE_URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL

type Props = { password: string }

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; commitUrl?: string }
  | { kind: 'error'; message: string }

export default function BagForm({ password }: Props) {
  const [rawEncyclopedia, setRawEncyclopedia] = useState<EncyclopediaBag[] | null>(null)
  const [visibility, setVisibility] = useState<CategoryVisibility>(DEFAULT_VISIBILITY)
  const [existingSlugs, setExistingSlugs] = useState<Set<string>>(new Set())
  const [encyclopediaId, setEncyclopediaId] = useState('')
  const [store, setStore] = useState<Store | null>(null)
  const [date, setDate] = useState(todayISO())
  const [memory, setMemory] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    fetch(`${BASE}data/encyclopedia.json`, { cache: 'no-cache' })
      .then((r) => r.json() as Promise<EncyclopediaBag[]>)
      .then(setRawEncyclopedia)
      .catch(() => setRawEncyclopedia([]))
    // Slugs are deterministic (`${encyclopediaId}-${date}`), so we can warn
    // the user before submit if a duplicate is brewing. The Worker enforces
    // this server-side too — this is just for instant feedback.
    fetch(`${BASE}data/pantry.json`, { cache: 'no-cache' })
      .then((r) => r.json() as Promise<PantryBag[]>)
      .then((pantry) => setExistingSlugs(new Set(pantry.map((b) => b.slug))))
      .catch(() => {
        /* empty set is fine — server is still the source of truth */
      })
    // Hide categories that admin has toggled off from the picker. State bags
    // always show. Mirrors the filter on the public encyclopedia.
    fetch(`${BASE}data/visibility.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? (r.json() as Promise<CategoryVisibility>) : null))
      .then((v) => {
        if (v) setVisibility({ ...DEFAULT_VISIBILITY, ...v })
      })
      .catch(() => {
        /* keep defaults */
      })
  }, [])

  const encyclopedia = useMemo(() => {
    if (rawEncyclopedia === null) return null
    return rawEncyclopedia.filter((bag) => {
      if (bag.type === 'state') return visibility.state
      if (bag.type === 'special') return visibility.special
      if (bag.type === 'standard') return visibility.standard
      return true
    })
  }, [rawEncyclopedia, visibility])

  const selectedEncyclopediaBag = useMemo(
    () => encyclopedia?.find((b) => b.id === encyclopediaId) ?? null,
    [encyclopedia, encyclopediaId],
  )

  const pendingSlug = selectedEncyclopediaBag ? `${selectedEncyclopediaBag.id}-${date}` : ''
  const duplicate = pendingSlug !== '' && existingSlugs.has(pendingSlug)

  const valid =
    selectedEncyclopediaBag !== null &&
    store !== null &&
    date !== '' &&
    memory.trim().length > 0 &&
    !duplicate

  function reset() {
    setEncyclopediaId('')
    setStore(null)
    setDate(todayISO())
    setMemory('')
    setPhotos([])
    setStatus({ kind: 'idle' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !selectedEncyclopediaBag || !store || status.kind === 'saving') return

    const bag = {
      slug: pendingSlug,
      name: bagDisplayName(selectedEncyclopediaBag),
      encyclopediaId: selectedEncyclopediaBag.id,
      storeNumber: store.storeNumber,
      dateAcquired: date,
      memory: memory.trim(),
    }

    // Fallback when the Worker isn't deployed yet — show JSON for manual commit.
    if (!WORKER_URL) {
      const localBag: PantryBag = { ...bag, photos: [] }
      setStatus({ kind: 'saved' })
      setShowJsonFallback(JSON.stringify(localBag, null, 2))
      return
    }

    setStatus({ kind: 'saving' })
    try {
      const encoded = await Promise.all(
        photos.map(async (file) => ({
          name: file.name,
          base64: await fileToBase64(file),
        })),
      )

      const res = await fetch(`${WORKER_URL}/pantry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, bag, photos: encoded }),
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
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message })
    }
  }

  // The fallback path needs to render the JSON — kept in local state so the
  // success view can show it without re-stringifying.
  const [jsonFallback, setShowJsonFallback] = useState<string | null>(null)

  if (status.kind === 'saved') {
    return (
      <SavedPanel
        commitUrl={status.commitUrl}
        jsonFallback={jsonFallback}
        onReset={() => {
          setShowJsonFallback(null)
          reset()
        }}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field
        label="Which Bag?"
        hint="Pick from the encyclopedia. Don't see it? Use the Suggest a Bag form on the encyclopedia page first, then come back."
      >
        <EncyclopediaPicker
          encyclopedia={encyclopedia}
          value={encyclopediaId}
          onChange={setEncyclopediaId}
        />
      </Field>

      <Field
        label="Where Did You Buy It?"
        hint="Search Trader Joe's stores by city, state, or store number."
      >
        <StoreSelect value={store} onChange={setStore} />
      </Field>

      <Field label="Date Acquired">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          max={todayISO()}
          className="w-full border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-3 py-2.5 font-serif text-base outline-none focus:bg-white transition-colors"
        />
      </Field>

      <Field
        label="Photos"
        hint={
          WORKER_URL
            ? 'Pick up to 5 photos of the bag from your camera roll.'
            : 'Photo upload is disabled until the Cloudflare Worker is deployed. Pick photos to preview them; you’ll need to add them to the repo manually until then.'
        }
      >
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </Field>

      <Field
        label="The Memory"
        hint="Tell the story. Who were you with? What were you shopping for? Anything that makes this bag yours."
      >
        <textarea
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          required
          rows={5}
          maxLength={1200}
          placeholder="Once upon a Saturday morning at Trader Joe's…"
          className="w-full border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-3 py-2.5 font-serif text-base outline-none focus:bg-white transition-colors resize-y"
        />
        <div className="text-right text-[0.65rem] opacity-50 font-[var(--tj-body)] tracking-wider mt-1">
          {memory.length} / 1200
        </div>
      </Field>

      {duplicate && (
        <div className="border-2 border-[var(--tj-red)] bg-[var(--tj-red)]/10 px-4 py-3 text-sm">
          <strong className="font-[var(--tj-body)] tracking-[0.15em] text-xs uppercase block mb-1">
            Already in the pantry
          </strong>
          <span className="italic opacity-90">
            This bag is already logged for {date}. Pick a different date if you got
            another one, or check the pantry to see the existing entry.
          </span>
        </div>
      )}

      {status.kind === 'error' && (
        <div className="border-2 border-[var(--tj-red)] bg-[var(--tj-red)]/10 p-4 space-y-4 text-sm">
          <div>
            <strong className="font-[var(--tj-body)] tracking-[0.15em] text-xs uppercase block mb-1">
              Save failed
            </strong>
            <span className="italic opacity-90">{status.message}</span>
          </div>
          {selectedEncyclopediaBag && store && (
            <RecoveryDownloads
              bag={{
                slug: pendingSlug,
                name: bagDisplayName(selectedEncyclopediaBag),
                encyclopediaId: selectedEncyclopediaBag.id,
                storeNumber: store.storeNumber,
                dateAcquired: date,
                memory: memory.trim(),
              }}
              photos={photos}
            />
          )}
        </div>
      )}

      <div className="pt-2 flex items-center justify-between gap-4">
        <p className="text-xs italic opacity-60 max-w-sm">
          {WORKER_URL
            ? 'Saving will commit the bag to the GitHub repo and rebuild the site (~1 minute).'
            : 'Worker not configured — save will produce a JSON snippet for manual commit.'}
        </p>
        <button
          type="submit"
          disabled={!valid || status.kind === 'saving'}
          className="font-[var(--tj-body)] tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.kind === 'saving' ? 'Saving…' : 'Save Bag'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-[var(--tj-body)] tracking-[0.2em] text-[0.7rem] uppercase block mb-1">
        {label}
      </span>
      {hint && <span className="block text-xs italic opacity-65 mb-2">{hint}</span>}
      {children}
    </label>
  )
}

function EncyclopediaPicker({
  encyclopedia,
  value,
  onChange,
}: {
  encyclopedia: EncyclopediaBag[] | null
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedBag = useMemo(
    () => encyclopedia?.find((b) => b.id === value) ?? null,
    [encyclopedia, value],
  )

  useEffect(() => {
    if (!open) return
    function close(e: Event) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const filteredGroups = useMemo(() => {
    const all = encyclopedia ?? []
    const q = query.trim().toLowerCase()
    if (!q) return groupEncyclopedia(all)
    const matches = all.filter((b) => {
      const haystack = `${bagDisplayName(b)} ${b.id} ${b.state ?? ''} ${b.stateCode ?? ''} ${b.region ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
    return groupEncyclopedia(matches)
  }, [encyclopedia, query])

  function selectBag(id: string) {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  const triggerLabel = encyclopedia === null
    ? 'Loading encyclopedia…'
    : selectedBag
      ? bagDisplayName(selectedBag)
      : 'Pick a bag from the encyclopedia'
  const triggerIsPlaceholder = !selectedBag

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
            setQuery('')
          } else {
            setOpen(true)
          }
        }}
        disabled={encyclopedia === null}
        className="w-full flex items-center justify-between gap-3 border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-3 py-2.5 text-left font-serif text-base hover:bg-white transition-colors disabled:opacity-60"
      >
        <span className={triggerIsPlaceholder ? 'italic opacity-65' : ''}>
          {triggerLabel}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className={`w-2.5 h-1.5 opacity-60 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && encyclopedia && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] shadow-[0_4px_0_rgba(42,31,20,0.15)]">
          <input
            type="text"
            value={query}
            placeholder="Search by name, state, or ID"
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-b-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
          />
          <ul className="max-h-72 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <li className="px-3 py-2.5 italic text-sm opacity-70">
                No bags match "{query}"
              </li>
            ) : (
              filteredGroups.map((group) => (
                <li key={group.label}>
                  <div className="px-3 py-1 font-[var(--tj-body)] tracking-[0.2em] text-[0.6rem] uppercase font-semibold opacity-70 bg-[var(--tj-kraft)]/40 border-b border-[var(--tj-ink)]/15">
                    {group.label}
                  </div>
                  <ul>
                    {group.bags.map((bag) => (
                      <li key={bag.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onTouchEnd={(e) => {
                            e.preventDefault()
                            selectBag(bag.id)
                          }}
                          onClick={() => selectBag(bag.id)}
                          style={{ touchAction: 'manipulation' }}
                          className={`w-full text-left px-3 py-2 hover:bg-[var(--tj-kraft)] focus:bg-[var(--tj-kraft)] focus:outline-none border-b border-[var(--tj-ink)]/15 last:border-b-0 ${
                            bag.id === value ? 'bg-[var(--tj-kraft)]/40' : ''
                          }`}
                        >
                          <div className="font-serif leading-tight">
                            {bagDisplayName(bag)}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function PhotoPicker({
  photos,
  onChange,
}: {
  photos: File[]
  onChange: (files: File[]) => void
}) {
  function onFilesPicked(files: FileList | null) {
    if (!files) return
    const next = [...photos, ...Array.from(files)].slice(0, 8)
    onChange(next)
  }

  function removeAt(i: number) {
    onChange(photos.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          onFilesPicked(e.target.files)
          e.target.value = ''
        }}
        className="w-full text-sm font-serif file:mr-3 file:border-2 file:border-[var(--tj-ink)] file:bg-[var(--tj-cream)] file:px-3 file:py-2 file:font-[var(--tj-body)] file:tracking-[0.15em] file:text-[0.7rem] file:uppercase file:cursor-pointer hover:file:bg-[var(--tj-ink)] hover:file:text-[var(--tj-cream)]"
      />
      {photos.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((file, i) => (
            <li key={`${file.name}-${i}`} className="relative">
              <PhotoThumb file={file} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${file.name}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--tj-ink)] text-[var(--tj-cream)] text-xs font-bold leading-none hover:bg-[var(--tj-red)]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {photos.length >= 5 && (
        <p className="text-xs italic opacity-60">Maximum 5 photos.</p>
      )}
    </div>
  )
}

function PhotoThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  return (
    <div className="aspect-square border-2 border-[var(--tj-ink)] bg-white overflow-hidden">
      {url && <img src={url} alt={file.name} className="w-full h-full object-cover" />}
    </div>
  )
}

/* Recovery escape hatch — shown only inside the error panel. Lets the user
   save the bag metadata + each photo locally so Kayley can commit them by
   hand if the Worker round-trip never succeeds. */
function RecoveryDownloads({
  bag,
  photos,
}: {
  bag: {
    slug: string
    name: string
    encyclopediaId: string
    storeNumber: string
    dateAcquired: string
    memory: string
  }
  photos: File[]
}) {
  const jsonText = useMemo(
    () => JSON.stringify({ ...bag, photos: [] }, null, 2),
    [bag],
  )
  const [jsonUrl, setJsonUrl] = useState<string | null>(null)
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([jsonText], { type: 'application/json' }))
    setJsonUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [jsonText])

  return (
    <div className="space-y-3 border-t border-[var(--tj-red)]/30 pt-4">
      <p className="text-xs italic opacity-80 leading-relaxed">
        Don't worry — save everything below and Kayley can commit it by hand.
        On iPhone: tap the JSON to download it, then long-press each photo and
        choose <em>Save to Photos</em>.
      </p>
      <div className="flex flex-wrap items-start gap-3">
        {jsonUrl && (
          <a
            href={jsonUrl}
            download={`${bag.slug || 'bag'}.json`}
            className="inline-flex items-center gap-1 font-[var(--tj-body)] tracking-[0.15em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-3 py-2 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors no-underline"
          >
            <span aria-hidden>↓</span> Bag JSON
          </a>
        )}
        {photos.map((file, i) => (
          <PhotoDownloadLink key={`${file.name}-${i}`} file={file} index={i + 1} />
        ))}
      </div>
      {photos.length === 0 && (
        <p className="text-xs italic opacity-60">No photos to save — just the JSON.</p>
      )}
    </div>
  )
}

function PhotoDownloadLink({ file, index }: { file: File; index: number }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  return (
    <a
      href={url ?? '#'}
      download={file.name}
      title={`Download photo ${index} (${file.name})`}
      className="block relative w-20 h-20 border-2 border-[var(--tj-ink)] bg-white overflow-hidden hover:opacity-80 transition-opacity no-underline"
    >
      {url && <img src={url} alt="" className="w-full h-full object-cover" />}
      <span className="absolute bottom-0 left-0 right-0 bg-[var(--tj-ink)]/90 text-[var(--tj-cream)] text-[0.6rem] tracking-[0.15em] uppercase font-semibold text-center py-0.5">
        ↓ {index}
      </span>
    </a>
  )
}

function SavedPanel({
  commitUrl,
  jsonFallback,
  onReset,
}: {
  commitUrl?: string
  jsonFallback: string | null
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    if (!jsonFallback) return
    try {
      await navigator.clipboard.writeText(jsonFallback)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* no-op */
    }
  }

  return (
    <div className="space-y-5">
      <div className="border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] p-5">
        <h2 className="font-[var(--tj-body)] tracking-[0.25em] text-xs uppercase mb-3">
          {jsonFallback ? 'Bag Saved (Pending Commit)' : 'Bag Saved!'}
        </h2>
        {jsonFallback ? (
          <>
            <p className="text-sm italic opacity-80 mb-4">
              The Cloudflare Worker isn't configured yet, so to make this bag show up on
              the site, append the JSON below to{' '}
              <code className="bg-[var(--tj-kraft)]/40 px-1.5 py-0.5">
                public/data/pantry.json
              </code>{' '}
              and commit. Once <code className="bg-[var(--tj-kraft)]/40 px-1.5 py-0.5">VITE_WORKER_URL</code> is set, this step goes away.
            </p>
            <div className="relative">
              <pre className="bg-white border border-[var(--tj-ink)] p-4 text-xs overflow-x-auto font-mono">
                {jsonFallback}
              </pre>
              <button
                type="button"
                onClick={copy}
                className="absolute top-2 right-2 font-[var(--tj-body)] tracking-[0.15em] text-[0.65rem] uppercase border border-[var(--tj-ink)] bg-[var(--tj-cream)] px-2.5 py-1 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm italic opacity-80">
            The bag is committed. GitHub Pages takes about a minute to rebuild —
            it'll appear on the site shortly.
            {commitUrl && (
              <>
                {' '}
                <a
                  href={commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-[var(--tj-red)]"
                >
                  View the commit →
                </a>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="font-[var(--tj-body)] tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] px-5 py-2.5 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
        >
          + Log Another
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────  helpers  ────────────────────────────── */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function bagDisplayName(bag: EncyclopediaBag): string {
  if (bag.region) return `${bag.region} (${bag.state ?? bag.stateCode ?? ''})`.trim()
  return bag.name
}

function groupEncyclopedia(encyclopedia: EncyclopediaBag[]): { label: string; bags: EncyclopediaBag[] }[] {
  const order: { type: EncyclopediaBag['type']; label: string }[] = [
    { type: 'state', label: 'Locale Bags' },
    { type: 'special', label: 'Special Editions' },
    { type: 'standard', label: 'Standard Bags' },
  ]
  return order
    .map(({ type, label }) => ({
      label,
      bags: encyclopedia
        .filter((b) => b.type === type)
        .sort((a, b) => bagDisplayName(a).localeCompare(bagDisplayName(b))),
    }))
    .filter((g) => g.bags.length > 0)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:<mime>;base64," prefix; the Worker only wants the encoded bytes.
      const comma = result.indexOf(',')
      resolve(comma === -1 ? result : result.slice(comma + 1))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
