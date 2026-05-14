import { useEffect, useMemo, useState } from 'react'
import type { CatalogBag, CollectionBag, Store } from '../../types'
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
  const [catalog, setCatalog] = useState<CatalogBag[] | null>(null)
  const [catalogId, setCatalogId] = useState('')
  const [store, setStore] = useState<Store | null>(null)
  const [date, setDate] = useState(todayISO())
  const [memory, setMemory] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    fetch(`${BASE}data/catalog.json`)
      .then((r) => r.json() as Promise<CatalogBag[]>)
      .then(setCatalog)
      .catch(() => setCatalog([]))
  }, [])

  const selectedCatalogBag = useMemo(
    () => catalog?.find((b) => b.id === catalogId) ?? null,
    [catalog, catalogId],
  )

  const valid =
    selectedCatalogBag !== null && store !== null && date !== '' && memory.trim().length > 0

  function reset() {
    setCatalogId('')
    setStore(null)
    setDate(todayISO())
    setMemory('')
    setPhotos([])
    setStatus({ kind: 'idle' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !selectedCatalogBag || !store || status.kind === 'saving') return

    const bag = {
      slug: `${selectedCatalogBag.id}-${date}`,
      name: bagDisplayName(selectedCatalogBag),
      catalogId: selectedCatalogBag.id,
      storeNumber: store.storeNumber,
      dateAcquired: date,
      memory: memory.trim(),
    }

    // Fallback when the Worker isn't deployed yet — show JSON for manual commit.
    if (!WORKER_URL) {
      const localBag: CollectionBag = { ...bag, photos: [] }
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

      const res = await fetch(`${WORKER_URL}/collection`, {
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
        hint="Pick from the catalog. Don't see it? Use the Suggest a Bag form on the catalog page first, then come back."
      >
        <CatalogPicker
          catalog={catalog}
          value={catalogId}
          onChange={setCatalogId}
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
            ? 'Pick up to 8 photos of the bag from your camera roll.'
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
        <div className="text-right text-[0.65rem] opacity-50 font-sans tracking-wider mt-1">
          {memory.length} / 1200
        </div>
      </Field>

      {status.kind === 'error' && (
        <div className="border-2 border-[var(--tj-red)] bg-[var(--tj-red)]/10 px-4 py-3 text-sm">
          <strong className="font-sans tracking-[0.15em] text-xs uppercase block mb-1">
            Save failed
          </strong>
          <span className="italic opacity-90">{status.message}</span>
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
          className="font-sans tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <span className="font-sans tracking-[0.2em] text-[0.7rem] uppercase block mb-1">
        {label}
      </span>
      {hint && <span className="block text-xs italic opacity-65 mb-2">{hint}</span>}
      {children}
    </label>
  )
}

function CatalogPicker({
  catalog,
  value,
  onChange,
}: {
  catalog: CatalogBag[] | null
  value: string
  onChange: (id: string) => void
}) {
  const grouped = useMemo(() => groupCatalog(catalog ?? []), [catalog])
  const placeholder = catalog === null ? 'Loading catalog…' : 'Pick a bag from the catalog'
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={catalog === null}
      required
      className="w-full border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-3 py-2.5 font-serif text-base outline-none focus:bg-white transition-colors disabled:opacity-60"
    >
      <option value="">{placeholder}</option>
      {grouped.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.bags.map((bag) => (
            <option key={bag.id} value={bag.id}>
              {bagDisplayName(bag)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
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
        className="w-full text-sm font-serif file:mr-3 file:border-2 file:border-[var(--tj-ink)] file:bg-[var(--tj-cream)] file:px-3 file:py-2 file:font-sans file:tracking-[0.15em] file:text-[0.7rem] file:uppercase file:cursor-pointer hover:file:bg-[var(--tj-ink)] hover:file:text-[var(--tj-cream)]"
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
      {photos.length >= 8 && (
        <p className="text-xs italic opacity-60">Maximum 8 photos.</p>
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
        <h2 className="font-sans tracking-[0.25em] text-xs uppercase mb-3">
          {jsonFallback ? 'Bag Saved (Pending Commit)' : 'Bag Saved!'}
        </h2>
        {jsonFallback ? (
          <>
            <p className="text-sm italic opacity-80 mb-4">
              The Cloudflare Worker isn't configured yet, so to make this bag show up on
              the site, append the JSON below to{' '}
              <code className="bg-[var(--tj-kraft)]/40 px-1.5 py-0.5">
                public/data/collection.json
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
                className="absolute top-2 right-2 font-sans tracking-[0.15em] text-[0.65rem] uppercase border border-[var(--tj-ink)] bg-[var(--tj-cream)] px-2.5 py-1 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
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
          className="font-sans tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] px-5 py-2.5 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
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

function bagDisplayName(bag: CatalogBag): string {
  if (bag.region) return `${bag.region} (${bag.state ?? bag.stateCode ?? ''})`.trim()
  return bag.name
}

function groupCatalog(catalog: CatalogBag[]): { label: string; bags: CatalogBag[] }[] {
  const order: { type: CatalogBag['type']; label: string }[] = [
    { type: 'state', label: 'Locale Bags' },
    { type: 'special', label: 'Special Editions' },
    { type: 'seasonal', label: 'Seasonal' },
    { type: 'standard', label: 'Standard Bags' },
  ]
  return order
    .map(({ type, label }) => ({
      label,
      bags: catalog
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
