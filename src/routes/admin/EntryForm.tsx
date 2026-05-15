import { useMemo, useState } from 'react'
import type { BagType, EncyclopediaBag, Material } from '../../types'
import { US_LOCALES } from '../../usLocales'
import { MATERIAL_LABEL, MATERIAL_ORDER } from '../../materials'
import { ANGLE_LABEL, ANGLE_ORDER, type Angle } from '../../bagPhotos'

/* ────────────────────────────────────────────────────────────────────
   EntryForm — admin form to author a *new encyclopedia entry* (a bag
   design), separate from BagForm which logs a bag Parker actually owns.

   Persistence is mocked: the submit handler builds the payload and prints
   a preview. Wiring this to the Cloudflare Worker is a TODO.
   ──────────────────────────────────────────────────────────────────── */

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
  materials: Material[]
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
  materials: [],
}

type Submitted = {
  entry: EncyclopediaBag
  designNotes: { subtitle?: string; blurb?: string }
  photoFilenames: string[]
}

export default function EntryForm({ password: _password }: { password: string }) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [photos, setPhotos] = useState<PhotoMap>({})
  const [submitted, setSubmitted] = useState<Submitted | null>(null)

  const isLocaleType = form.type === 'state'
  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.id)
  const canSubmit = form.name.trim().length > 0 && form.type !== '' && slugValid

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setPhoto(angle: Angle, file: File | null) {
    setPhotos((prev) => {
      // Revoke the old preview URL to avoid memory leaks.
      const old = prev[angle]
      if (old) URL.revokeObjectURL(old.previewUrl)
      const next = { ...prev }
      if (file) next[angle] = { file, previewUrl: URL.createObjectURL(file) }
      else delete next[angle]
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const locale = US_LOCALES.find((l) => l.code === form.stateCode)
    const yearNum = form.year ? Number(form.year) : undefined

    const referencePhotos = ANGLE_ORDER
      .filter((a) => photos[a])
      .map((a) => `bags/${form.id}/${a}.${extensionFor(photos[a]!.file)}`)

    const entry: EncyclopediaBag = {
      id: form.id,
      name: form.name.trim(),
      type: form.type as BagType,
      state: isLocaleType ? locale?.name : undefined,
      stateCode: isLocaleType ? locale?.code : undefined,
      region: form.region.trim() || undefined,
      year: yearNum && Number.isFinite(yearNum) ? yearNum : undefined,
      source: form.source.trim() || undefined,
      materials: form.materials.length > 0 ? form.materials : undefined,
      referencePhotos: referencePhotos.length > 0 ? referencePhotos : undefined,
    }

    const designNotes: Submitted['designNotes'] = {}
    if (form.subtitle.trim()) designNotes.subtitle = form.subtitle.trim()
    if (form.blurb.trim()) designNotes.blurb = form.blurb.trim()

    // TODO: POST to Worker /encyclopedia-entries with `entry`, `designNotes`,
    // and the 5 photo files (multipart). Worker would commit to GitHub and
    // refresh the deployment. For now we just preview the payload.
    setSubmitted({
      entry,
      designNotes,
      photoFilenames: ANGLE_ORDER
        .filter((a) => photos[a])
        .map((a) => `${a}.${extensionFor(photos[a]!.file)}`),
    })
  }

  function reset() {
    // revoke any preview URLs still around
    for (const a of ANGLE_ORDER) {
      const p = photos[a]
      if (p) URL.revokeObjectURL(p.previewUrl)
    }
    setPhotos({})
    setForm(EMPTY)
    setSubmitted(null)
  }

  if (submitted) {
    return <SubmittedPreview submitted={submitted} onReset={reset} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="font-[var(--tj-body)] italic text-sm opacity-75">
        Author a new bag for the encyclopedia. Once the Worker is wired up this
        will commit a new entry + photos to the repo automatically.
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
            <option value="seasonal">Seasonal</option>
            <option value="standard">Standard everyday bag</option>
          </select>
        </Field>

        <Field label="Year (optional)">
          <input
            type="number"
            inputMode="numeric"
            value={form.year}
            onChange={(e) => update('year', e.target.value)}
            min={2000}
            max={2100}
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

      <Field label="About / Blurb (optional)" hint="A few sentences describing the design panel-by-panel.">
        <textarea
          value={form.blurb}
          onChange={(e) => update('blurb', e.target.value)}
          rows={4}
          maxLength={1500}
          placeholder="A five-panel tour of the state…"
          className="w-full border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none resize-y"
        />
      </Field>

      <Field label="Source URL (optional)" hint="Where you found the bag for reference (eBay, Mercari, blog, etc.).">
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

      <Field label="Photos" hint="Upload one per angle. All optional, but the photo viewer needs at least Front to show anything.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {ANGLE_ORDER.map((angle) => (
            <PhotoPicker
              key={angle}
              angle={angle}
              file={photos[angle]}
              onChange={(f) => setPhoto(angle, f)}
            />
          ))}
        </div>
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
  onChange,
}: {
  angle: Angle
  file: PhotoFile | undefined
  onChange: (file: File | null) => void
}) {
  const inputId = useMemo(() => `photo-${angle}-${Math.random().toString(36).slice(2, 7)}`, [angle])
  return (
    <div className="border-2 border-dashed border-[var(--tj-ink)]/40 p-3 bg-[var(--tj-cream)]/60">
      <div className="flex items-center justify-between mb-2">
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
    </div>
  )
}

function SubmittedPreview({
  submitted,
  onReset,
}: {
  submitted: Submitted
  onReset: () => void
}) {
  const designNotesHasContent =
    submitted.designNotes.subtitle || submitted.designNotes.blurb

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
          The Worker isn't wired yet, so the entry hasn't been written to the
          repo. The data that <em>would</em> be submitted is below — copy it
          into the right files for now, and we'll automate later.
        </p>
      </div>

      <div>
        <SectionLabel>Add to public/data/encyclopedia.json</SectionLabel>
        <PayloadBlock value={JSON.stringify(submitted.entry, null, 2)} />
      </div>

      {designNotesHasContent && (
        <div>
          <SectionLabel>
            Add to DESIGN_NOTES in src/bagPhotos.ts (key: "{submitted.entry.id}")
          </SectionLabel>
          <PayloadBlock value={JSON.stringify(submitted.designNotes, null, 2)} />
        </div>
      )}

      {submitted.photoFilenames.length > 0 && (
        <div>
          <SectionLabel>
            Save photos to public/bags/{submitted.entry.id}/
          </SectionLabel>
          <ul className="font-mono text-sm bg-white/80 border-2 border-[var(--tj-ink)]/30 p-3 list-disc list-inside">
            {submitted.photoFilenames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onReset}
          className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors"
        >
          Add Another
        </button>
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
  // Fall back to MIME mapping for cases where the user-supplied name has no ext.
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/webp') return 'webp'
  return 'png'
}
