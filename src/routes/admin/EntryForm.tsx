import { useMemo, useState } from 'react'
import type { BagType, EncyclopediaBag, Material } from '../../types'
import { US_LOCALES } from '../../usLocales'
import { MATERIAL_LABEL, MATERIAL_ORDER } from '../../materials'
import { ANGLE_LABEL, ANGLE_ORDER, type Angle } from '../../bagPhotos'

/* ────────────────────────────────────────────────────────────────────
   EntryForm — admin form to author a *new encyclopedia entry* (a bag
   design), separate from BagForm which logs a bag Parker actually owns.
   Two-step flow: fill → preview → commit. The commit step POSTs to
   the Worker's /encyclopedia endpoint which writes both the entry and
   the photos in one atomic GitHub commit.
   ──────────────────────────────────────────────────────────────────── */

const WORKER_URL = import.meta.env.VITE_WORKER_URL

type PhotoFile = { file: File; previewUrl: string }
type PhotoMap = Partial<Record<Angle, PhotoFile>>

type FormState = {
  id: string
  name: string
  type: BagType | ''
  stateCode: string
  region: string
  year: string
  source: string
  subtitle: string
  blurb: string
  description: string
  note: string
  noteSourcesText: string
  cardZoom: string
  materials: Material[]
}

type AngleStrings = Partial<Record<Angle, string>>

const SECTION_HINTS: Record<BagType, string> = {
  state: 'A locale tote — one design per US state, region, or city (e.g. Alabama, Atlanta).',
  special: 'A limited-run release — collabs, anniversaries, holiday editions (e.g. 50th Anniversary, Fearless Flyer).',
  standard: "An everyday bag in TJ's permanent lineup (e.g. Classic Reusable, Insulated, Canvas Micro).",
}

const EMPTY: FormState = {
  id: '',
  name: '',
  type: '',
  stateCode: '',
  region: '',
  year: '',
  source: '',
  subtitle: '',
  blurb: '',
  description: '',
  note: '',
  noteSourcesText: '',
  cardZoom: '',
  materials: [],
}

type Submitted = {
  entry: EncyclopediaBag
  photoDir: string
  photoFilenames: string[]
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; commitUrl?: string }
  | { kind: 'error'; message: string }

export default function EntryForm({ password }: { password: string }) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [photos, setPhotos] = useState<PhotoMap>({})
  const [angleCaptions, setAngleCaptions] = useState<AngleStrings>({})
  const [angleSources, setAngleSources] = useState<AngleStrings>({})
  const [submitted, setSubmitted] = useState<Submitted | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const isLocaleType = form.type === 'state'
  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.id)
  const canSubmit = form.name.trim().length > 0 && form.type !== '' && slugValid

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setPhoto(angle: Angle, file: File | null) {
    setPhotos((prev) => {
      // Revoke old object URL so the bitmap can be GC'd.
      const old = prev[angle]
      if (old) URL.revokeObjectURL(old.previewUrl)
      const next = { ...prev }
      if (file) next[angle] = { file, previewUrl: URL.createObjectURL(file) }
      else delete next[angle]
      return next
    })
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const locale = US_LOCALES.find((l) => l.code === form.stateCode)
    const year = parseYear(form.year)
    const materials = form.materials.length > 0 ? form.materials : undefined

    const photoDir = computePhotoDir({
      type: form.type as BagType,
      id: form.id,
      region: form.region.trim(),
      stateName: locale?.name,
      materials,
    })

    const referencePhotos = ANGLE_ORDER
      .filter((a) => photos[a])
      .map((a) => `${photoDir}/${a}.${extensionFor(photos[a]!.file)}`)

    // Build design — only include fields with content
    const trimmedCaptions: AngleStrings = {}
    for (const a of ANGLE_ORDER) {
      const v = angleCaptions[a]?.trim()
      if (v) trimmedCaptions[a] = v
    }
    const design: NonNullable<EncyclopediaBag['design']> = {}
    if (form.subtitle.trim()) design.subtitle = form.subtitle.trim()
    if (form.blurb.trim()) design.blurb = form.blurb.trim()
    if (Object.keys(trimmedCaptions).length > 0) design.angleCaptions = trimmedCaptions

    // Per-angle source URLs (only for angles whose photo is set so paths line up)
    const trimmedSources: AngleStrings = {}
    for (const a of ANGLE_ORDER) {
      if (!photos[a]) continue
      const v = angleSources[a]?.trim()
      if (v) trimmedSources[a] = v
    }

    // noteSources only meaningful when there's a note. If the user typed sources
    // then cleared the note, drop the sources so the data stays internally consistent.
    const noteSources = form.note.trim()
      ? form.noteSourcesText
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    const cardZoomNum = form.cardZoom.trim() ? Number(form.cardZoom) : NaN

    const entry: EncyclopediaBag = {
      id: form.id,
      name: form.name.trim(),
      type: form.type as BagType,
      state: isLocaleType ? locale?.name : undefined,
      stateCode: isLocaleType ? locale?.code : undefined,
      region: form.region.trim() || undefined,
      year,
      description: form.description.trim() || undefined,
      design: Object.keys(design).length > 0 ? design : undefined,
      note: form.note.trim() || undefined,
      noteSources: noteSources.length > 0 ? noteSources : undefined,
      source: form.source.trim() || undefined,
      referencePhotoSources:
        Object.keys(trimmedSources).length > 0 ? trimmedSources : undefined,
      materials,
      cardZoom: Number.isFinite(cardZoomNum) ? cardZoomNum : undefined,
      referencePhotos: referencePhotos.length > 0 ? referencePhotos : undefined,
    }

    setSubmitted({
      entry,
      photoDir,
      photoFilenames: ANGLE_ORDER
        .filter((a) => photos[a])
        .map((a) => `${a}.${extensionFor(photos[a]!.file)}`),
    })
    setStatus({ kind: 'idle' })
  }

  async function commit() {
    if (!submitted || status.kind === 'saving') return
    if (!WORKER_URL) {
      setStatus({ kind: 'error', message: 'Worker URL is not configured. Cannot save.' })
      return
    }
    setStatus({ kind: 'saving' })
    try {
      // Encode each chosen photo with its angle, mirrors how the worker keys files by angle.
      const encodedPhotos = await Promise.all(
        ANGLE_ORDER.filter((a) => photos[a]).map(async (angle) => ({
          angle,
          name: photos[angle]!.file.name,
          base64: await fileToBase64(photos[angle]!.file),
        })),
      )

      // Strip referencePhotos before sending — the Worker re-derives them from photoDir + uploaded angles
      // so the client can't write paths that don't match files actually committed.
      const { referencePhotos: _rp, ...entryToSend } = submitted.entry

      const res = await fetch(`${WORKER_URL}/encyclopedia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          entry: entryToSend,
          photoDir: submitted.photoDir,
          photos: encodedPhotos,
        }),
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

  function reset() {
    for (const a of ANGLE_ORDER) {
      const p = photos[a]
      if (p) URL.revokeObjectURL(p.previewUrl)
    }
    setPhotos({})
    setAngleCaptions({})
    setAngleSources({})
    setForm(EMPTY)
    setSubmitted(null)
    setStatus({ kind: 'idle' })
  }

  if (submitted) {
    return (
      <SubmittedPreview
        submitted={submitted}
        status={status}
        onBack={() => setSubmitted(null)}
        onCommit={commit}
        onReset={reset}
      />
    )
  }

  return (
    <form onSubmit={handlePreview} className="space-y-6">
      <p className="font-[var(--tj-body)] italic text-sm opacity-75">
        Author a new bag for the encyclopedia. Fill in the details, preview
        the entry, then commit. The Worker writes the JSON + photos to the
        repo in one commit, which kicks off a redeploy.
      </p>

      <Field label="Encyclopedia ID" required hint="URL-safe slug. State-only bags use the 2-letter code (e.g. 'wy'). Sub-state uses 'state-region' (e.g. 'tn-nashville'). Non-location bags use a descriptive slug (e.g. 'pickle-cotton').">
        <input
          type="text"
          value={form.id}
          onChange={(e) => update('id', e.target.value.toLowerCase())}
          required
          maxLength={64}
          placeholder="wy"
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
        />
        {form.id && !slugValid && (
          <span className="block mt-1 text-xs italic text-[var(--tj-red)]">
            Use lowercase letters, numbers, and hyphens only (e.g. 'tn-nashville').
          </span>
        )}
      </Field>

      <Field label="Bag Name" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
          maxLength={120}
          placeholder="Wyoming"
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Section" required>
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value as FormState['type'])}
            required
            className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
          >
            <option value="">Pick a section</option>
            <option value="state">Locale (state, region, or city)</option>
            <option value="special">Special edition</option>
            <option value="standard">Standard everyday bag</option>
          </select>
          {form.type && (
            <span className="block mt-1.5 text-xs italic opacity-70">
              {SECTION_HINTS[form.type]}
            </span>
          )}
        </Field>

        <Field label="Year (optional)" hint='Number like "2024", or a vague string like "1980s" for vintage canvases.'>
          <input
            type="text"
            value={form.year}
            onChange={(e) => update('year', e.target.value)}
            maxLength={32}
            placeholder="2026"
            className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
          />
        </Field>
      </div>

      {isLocaleType && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="State">
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

          <Field label="Region / City (optional)" hint="e.g. Nashville, Philadelphia">
            <input
              type="text"
              value={form.region}
              onChange={(e) => update('region', e.target.value)}
              maxLength={80}
              className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
            />
          </Field>
        </div>
      )}

      <Field label="Tagline / Subtitle (optional)" hint='Short descriptor like "the Beautiful" or "Music City".'>
        <input
          type="text"
          value={form.subtitle}
          onChange={(e) => update('subtitle', e.target.value)}
          maxLength={120}
          placeholder="the Sunshine State"
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
        />
      </Field>

      <Field label="About / Blurb (optional)" hint="A few sentences describing the design panel-by-panel. Shown on the detail page.">
        <textarea
          value={form.blurb}
          onChange={(e) => update('blurb', e.target.value)}
          rows={4}
          maxLength={1500}
          placeholder="A five-panel tour of the state…"
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none resize-y"
        />
      </Field>

      <Field label="SEO Description (optional)" hint="Short one-or-two-line summary for the Google snippet and link previews. ~155 chars works best. If blank, the blurb's first 155 chars are used.">
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={2}
          maxLength={400}
          placeholder="An earlier Atlanta print framed like a souvenir ticket stub…"
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none resize-y"
        />
        {form.description && (
          <span className="block mt-1 text-[0.65rem] italic opacity-65">
            {form.description.length} / 155 chars (Google truncates around here)
          </span>
        )}
      </Field>

      <Field label="Editorial Note (optional)" hint='Only for rare, discontinued, or controversial bags — shows as a separate callout on the detail page. Leave blank for normal bags.'>
        <textarea
          value={form.note}
          onChange={(e) => update('note', e.target.value)}
          rows={3}
          maxLength={800}
          placeholder="Now considered a rare find. The bottom-panel map labels…"
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none resize-y"
        />
      </Field>

      {form.note.trim() && (
        <Field label="Note Sources (optional)" hint="Backup URLs for the note (Reddit threads, articles). One per line.">
          <textarea
            value={form.noteSourcesText}
            onChange={(e) => update('noteSourcesText', e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder={'https://www.reddit.com/r/traderjoes/...\nhttps://...'}
            className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-mono text-xs outline-none resize-y"
          />
        </Field>
      )}

      <Field label="Source URL (optional)" hint="Where you found the bag for reference. Used as the fallback when an individual photo doesn't have its own source.">
        <input
          type="url"
          value={form.source}
          onChange={(e) => update('source', e.target.value)}
          maxLength={400}
          placeholder="https://www.mercari.com/us/item/..."
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
        />
      </Field>

      <Field label="Materials" hint="Tick any that apply.">
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
          {MATERIAL_ORDER.map((m) => {
            const checked = form.materials.includes(m)
            return (
              <label
                key={m}
                className="inline-flex items-center gap-2 cursor-pointer font-serif text-sm select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    update(
                      'materials',
                      e.target.checked
                        ? [...form.materials, m]
                        : form.materials.filter((x) => x !== m),
                    )
                  }
                  className="accent-[var(--tj-ink)] w-4 h-4"
                />
                {MATERIAL_LABEL[m]}
              </label>
            )
          })}
        </div>
      </Field>

      <Field label="Photos" hint="Upload one per angle. All optional, but the photo viewer needs at least Front to show anything. Caption + source are per-photo and ignored when no photo is set.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {ANGLE_ORDER.map((angle) => (
            <PhotoPicker
              key={angle}
              angle={angle}
              file={photos[angle]}
              caption={angleCaptions[angle] ?? ''}
              sourceUrl={angleSources[angle] ?? ''}
              onChange={(f) => setPhoto(angle, f)}
              onCaptionChange={(v) =>
                setAngleCaptions((prev) => ({ ...prev, [angle]: v }))
              }
              onSourceChange={(v) =>
                setAngleSources((prev) => ({ ...prev, [angle]: v }))
              }
            />
          ))}
        </div>
      </Field>

      <Field label="Card Zoom (optional)" hint="Multiplier for the front photo in the gallery card only. 1.0 = no zoom, 1.2 = 20% larger. Useful when a design reads small inside the card frame.">
        <input
          type="text"
          inputMode="decimal"
          value={form.cardZoom}
          onChange={(e) => update('cardZoom', e.target.value)}
          maxLength={8}
          placeholder="1.0"
          className="w-32 border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
        />
      </Field>

      <div className="pt-2 flex items-center justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview Entry
        </button>
      </div>
    </form>
  )
}

/* ──────────────────────────  Pieces  ────────────────────────── */

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
      <span className="font-[var(--tj-body)] tracking-[0.2em] text-[0.7rem] uppercase block mb-1">
        {label}
        {required && <span className="text-[var(--tj-red)] ml-1">*</span>}
      </span>
      {hint && <span className="block text-xs italic opacity-65 mb-2">{hint}</span>}
      {children}
    </label>
  )
}

function PhotoPicker({
  angle,
  file,
  caption,
  sourceUrl,
  onChange,
  onCaptionChange,
  onSourceChange,
}: {
  angle: Angle
  file: PhotoFile | undefined
  caption: string
  sourceUrl: string
  onChange: (file: File | null) => void
  onCaptionChange: (value: string) => void
  onSourceChange: (value: string) => void
}) {
  const inputId = useMemo(() => `photo-${angle}-${Math.random().toString(36).slice(2, 7)}`, [angle])
  return (
    <div className="border-2 border-dashed border-[var(--tj-ink)]/40 p-3 bg-[var(--tj-cream)]/60 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-[var(--tj-body)] font-semibold tracking-[0.18em] text-[0.65rem] uppercase">
          {ANGLE_LABEL[angle]}
        </span>
        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="font-[var(--tj-body)] tracking-[0.15em] text-[0.6rem] uppercase font-semibold border border-[var(--tj-ink)] px-2 py-0.5 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      {file ? (
        <div className="aspect-[4/5] bg-[var(--tj-cream-dark)] border border-[var(--tj-ink)]/40 overflow-hidden">
          <img
            src={file.previewUrl}
            alt={`${ANGLE_LABEL[angle]} preview`}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="block aspect-[4/5] flex items-center justify-center text-center cursor-pointer bg-white/40 hover:bg-white/70 transition-colors"
        >
          <span className="font-[var(--tj-body)] italic text-sm opacity-70">
            Choose {ANGLE_LABEL[angle].toLowerCase()} photo
          </span>
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="sr-only"
      />
      {file && (
        <div className="space-y-2 pt-1">
          <input
            type="text"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            maxLength={300}
            placeholder={`Caption for ${ANGLE_LABEL[angle].toLowerCase()} (optional)`}
            className="w-full border border-[var(--tj-ink)]/50 bg-white/80 px-2 py-1.5 font-serif text-xs outline-none"
          />
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => onSourceChange(e.target.value)}
            maxLength={400}
            placeholder="Source URL (Poshmark/eBay listing, optional)"
            className="w-full border border-[var(--tj-ink)]/50 bg-white/80 px-2 py-1.5 font-mono text-xs outline-none"
          />
        </div>
      )}
    </div>
  )
}

function SubmittedPreview({
  submitted,
  status,
  onBack,
  onCommit,
  onReset,
}: {
  submitted: Submitted
  status: Status
  onBack: () => void
  onCommit: () => void
  onReset: () => void
}) {
  const saved = status.kind === 'saved'
  const saving = status.kind === 'saving'
  const error = status.kind === 'error' ? status.message : null

  return (
    <div className="space-y-5">
      <div className="border-2 border-[var(--tj-ink)] bg-[var(--tj-kraft)] p-5 text-center">
        {saved ? (
          <>
            <p className="text-3xl text-[var(--tj-red)] mb-1" style={{ fontFamily: 'var(--tj-script)' }}>
              Filed away
            </p>
            <p className="font-[var(--tj-body)] italic text-sm opacity-80">
              Committed to the repo. GitHub Actions is rebuilding the site;
              your new entry should appear in a minute or two.
            </p>
            {status.kind === 'saved' && status.commitUrl && (
              <a
                href={status.commitUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-block mt-2 font-[var(--tj-body)] tracking-[0.2em] text-[0.7rem] uppercase font-semibold underline hover:no-underline"
              >
                View commit ↗
              </a>
            )}
          </>
        ) : (
          <>
            <p className="text-3xl text-[var(--tj-red)] mb-1" style={{ fontFamily: 'var(--tj-script)' }}>
              Preview ready
            </p>
            <p className="font-[var(--tj-body)] italic text-sm opacity-80">
              Below is the entry and where its photos will land. Hit Commit to
              write both to the repo in one atomic commit.
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="border-2 border-[var(--tj-red)] bg-[var(--tj-red)]/10 px-4 py-3 text-sm">
          <strong className="font-[var(--tj-body)] tracking-[0.15em] text-xs uppercase block mb-1">
            Save failed
          </strong>
          <span className="italic opacity-90">{error}</span>
        </div>
      )}

      <div>
        <SectionLabel>Entry (public/data/encyclopedia.json)</SectionLabel>
        <PayloadBlock value={JSON.stringify(submitted.entry, null, 2)} />
      </div>

      {submitted.photoFilenames.length > 0 && (
        <div>
          <SectionLabel>Photos (public/{submitted.photoDir}/)</SectionLabel>
          <ul className="font-mono text-sm bg-white/80 border-2 border-[var(--tj-ink)]/30 p-3 list-disc list-inside">
            {submitted.photoFilenames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2 flex-wrap">
        {saved ? (
          <button
            type="button"
            onClick={onReset}
            className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors"
          >
            Add Another
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-transparent text-[var(--tj-ink)] px-6 py-3 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Edit
            </button>
            <button
              type="button"
              onClick={onCommit}
              disabled={saving}
              className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Committing…' : 'Commit to repo'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[var(--tj-body)] tracking-[0.22em] text-[0.65rem] uppercase font-semibold mb-2">
      {children}
    </p>
  )
}

function PayloadBlock({ value }: { value: string }) {
  return (
    <pre className="font-mono text-xs bg-white/80 border-2 border-[var(--tj-ink)]/30 p-3 overflow-x-auto whitespace-pre">
      {value}
    </pre>
  )
}

function extensionFor(file: File): string {
  const fromName = file.name.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase()
  if (fromName) return fromName
  // Filename has no extension — fall back to the browser-reported MIME type.
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/webp') return 'webp'
  return 'png'
}

// Mirrors the on-disk convention: state → locations/<locale>, special → split
// by material (jute/canvas/other), standard → standard-bags. Worker re-validates.
function computePhotoDir(args: {
  type: BagType
  id: string
  region: string
  stateName?: string
  materials?: Material[]
}): string {
  const { type, id, region, stateName, materials } = args
  let category: string
  if (type === 'state') category = 'locations'
  else if (type === 'standard') category = 'standard-bags'
  else if (materials?.includes('jute')) category = 'jute-bags'
  else if (materials?.includes('canvas')) category = 'canvas-bags'
  else category = 'special-bags'

  // State bags use the locale (region preferred when present, else state name) as the folder slug;
  // everything else uses the id directly.
  let slug = id
  if (type === 'state') {
    const source = region || stateName || id
    slug = toKebab(source)
  }
  return `bags/${category}/${slug}`
}

/**
 * Parse the year input. Empty → undefined. An integer 1900-2100 → number.
 * Anything else non-empty (e.g. "1980s", "late 1990s") → string, kept verbatim
 * for the vintage pre-polypropylene canvas entries.
 */
function parseYear(raw: string): number | string | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  if (Number.isInteger(n) && n >= 1900 && n <= 2100) return n
  return trimmed
}

function toKebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix; only the base64 payload goes to the worker.
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
