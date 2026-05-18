import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { EncyclopediaBag, EncyclopediaVariant, PantryBag } from '../types'
import {
  ANGLE_LABEL,
  ANGLE_ORDER,
  DESIGN_NOTES,
  type Angle,
  inferAngleMap,
  photoUrl,
} from '../bagPhotos'
import TopNav from '../TopNav'
import Footer from '../Footer'
import MaterialChips from '../MaterialChips'
import { US_LOCALES } from '../usLocales'
import { SPECIAL_MATERIAL_GROUPS } from './encyclopedia/sections'

const BASE = import.meta.env.BASE_URL

type LoadedData = {
  encyclopedia: EncyclopediaBag[]
  pantry: PantryBag[]
}

export default function EncyclopediaDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<LoadedData | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/encyclopedia.json`, { cache: 'no-cache' }).then((r) => r.json() as Promise<EncyclopediaBag[]>),
      fetch(`${BASE}data/pantry.json`, { cache: 'no-cache' }).then((r) => r.json() as Promise<PantryBag[]>),
    ])
      .then(([encyclopedia, pantry]) => setData({ encyclopedia, pantry }))
      .catch(() => setData({ encyclopedia: [], pantry: [] }))
  }, [])

  if (!data) return <LoadingState />

  const entry = data.encyclopedia.find((c) => c.id === id)
  if (!entry) return <NotInEncyclopedia id={id} />

  const ownedBag = data.pantry.find((b) => b.encyclopediaId === entry.id)

  const siblings = sectionSiblings(data.encyclopedia, entry)
  const idx = siblings.findIndex((c) => c.id === entry.id)
  const prev = idx > 0 ? siblings[idx - 1] : undefined
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : undefined

  return <EncyclopediaView entry={entry} ownedBag={ownedBag} prev={prev} next={next} />
}

/**
 * Returns the entry's section-mates in the same order the gallery view
 * renders them — so prev/next on a detail page walks the section linearly.
 * State entries follow US_LOCALES order; special entries follow the
 * material grouping (poly → jute → canvas → other); standard follows
 * encyclopedia.json array order.
 */
function sectionSiblings(
  all: EncyclopediaBag[],
  entry: EncyclopediaBag,
): EncyclopediaBag[] {
  if (entry.type === 'state') {
    const states = all.filter((c) => c.type === 'state')
    const stateOrder = new Map(US_LOCALES.map((l, i) => [l.code, i]))
    return states.sort((a, b) => {
      const ai = stateOrder.get(a.stateCode ?? '') ?? Number.MAX_SAFE_INTEGER
      const bi = stateOrder.get(b.stateCode ?? '') ?? Number.MAX_SAFE_INTEGER
      if (ai !== bi) return ai - bi
      return all.indexOf(a) - all.indexOf(b)
    })
  }
  const sameType = all.filter((c) => c.type === entry.type)
  if (entry.type !== 'special') return sameType
  const matIndex = new Map(
    SPECIAL_MATERIAL_GROUPS.map((g, i) => [g.material as string, i]),
  )
  const rankOf = (b: EncyclopediaBag) =>
    matIndex.get(b.materials?.[0] ?? '') ?? Number.MAX_SAFE_INTEGER
  return sameType.sort((a, b) => {
    const diff = rankOf(a) - rankOf(b)
    return diff !== 0 ? diff : all.indexOf(a) - all.indexOf(b)
  })
}

/* ──────────────────────── VIEW ──────────────────────── */

function EncyclopediaView({
  entry,
  ownedBag,
  prev,
  next,
}: {
  entry: EncyclopediaBag
  ownedBag: PantryBag | undefined
  prev: EncyclopediaBag | undefined
  next: EncyclopediaBag | undefined
}) {
  const design = DESIGN_NOTES[entry.id] ?? {}

  const variants = entry.variants ?? []
  const [activeVariantId, setActiveVariantId] = useState<string | undefined>(
    variants[0]?.id,
  )
  const activeVariant: EncyclopediaVariant | undefined = useMemo(
    () => variants.find((v) => v.id === activeVariantId),
    [variants, activeVariantId],
  )

  const colorways = activeVariant?.colorways ?? []
  const hasColorways = colorways.length > 0
  const [activeColorwayId, setActiveColorwayId] = useState<string | undefined>(
    colorways[0]?.id,
  )
  const activeColorway = useMemo(
    () => colorways.find((c) => c.id === activeColorwayId) ?? colorways[0],
    [colorways, activeColorwayId],
  )

  // When the user switches variants, reset to that variant's first colorway.
  useEffect(() => {
    setActiveColorwayId(colorways[0]?.id)
  }, [activeVariantId, colorways])

  const photos = useMemo(() => {
    if (hasColorways) return colorways.map((c) => c.photo)
    if (activeVariant?.referencePhotos?.length) return activeVariant.referencePhotos
    if (entry.referencePhotos?.length) return entry.referencePhotos
    if (entry.referencePhoto) return [entry.referencePhoto]
    return []
  }, [hasColorways, colorways, activeVariant, entry.referencePhotos, entry.referencePhoto])

  const angleMap = useMemo(() => inferAngleMap(photos), [photos])
  const availableAngles = useMemo(
    () => ANGLE_ORDER.filter((a) => angleMap[a]),
    [angleMap],
  )
  const hasAngleData = !hasColorways && availableAngles.length > 0
  const initialAngle: Angle = availableAngles[0] ?? 'front'
  const [angle, setAngle] = useState<Angle>(initialAngle)

  useEffect(() => {
    if (availableAngles.length > 0 && !availableAngles.includes(angle)) {
      setAngle(availableAngles[0])
    }
  }, [availableAngles, angle])

  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollToIdx = (i: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' })
  }

  const cycleAngle = (dir: 1 | -1) => {
    if (availableAngles.length < 2) return
    const i = availableAngles.indexOf(angle)
    const nextIdx = Math.max(0, Math.min(availableAngles.length - 1, i + dir))
    scrollToIdx(nextIdx)
  }

  const cycleColorway = (dir: 1 | -1) => {
    if (colorways.length < 2) return
    const i = colorways.findIndex((c) => c.id === activeColorway?.id)
    const nextIdx = Math.max(0, Math.min(colorways.length - 1, i + dir))
    scrollToIdx(nextIdx)
  }

  // When the user swipes the carousel, sync the angle/colorway state to
  // whichever slide they landed on so captions and the label-button row
  // track the visible image.
  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el || el.clientWidth === 0) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (hasColorways) {
      const cw = colorways[next]
      if (cw && cw.id !== activeColorway?.id) setActiveColorwayId(cw.id)
    } else if (hasAngleData) {
      const a = availableAngles[next]
      if (a && a !== angle) setAngle(a)
    }
  }

  // When the variant changes the photo list is rebuilt, so reset the
  // scroller to slide 0 to match the colorway/angle reset above.
  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollLeft = 0
  }, [activeVariantId])

  // Unified slide list for the swipe carousel. Colorways take precedence,
  // then angle-tagged photos, then a single-photo fallback. Each slide
  // carries enough to render itself + its caption.
  type Slide = { url: string; label: string; caption?: string }
  const slides = useMemo<Slide[]>(() => {
    if (hasColorways) {
      return colorways.map((c) => ({ url: photoUrl(c.photo), label: c.name }))
    }
    if (hasAngleData) {
      return availableAngles.map((a) => ({
        url: photoUrl(angleMap[a]!),
        label: ANGLE_LABEL[a],
        caption: design.angleCaptions?.[a],
      }))
    }
    if (photos.length > 0) {
      return [{ url: photoUrl(photos[0]), label: '' }]
    }
    return []
  }, [hasColorways, colorways, hasAngleData, availableAngles, angleMap, photos, design.angleCaptions])

  const activeCaption = hasAngleData ? design.angleCaptions?.[angle] : undefined

  const activePhotoSources =
    activeVariant?.referencePhotoSources ?? entry.referencePhotoSources
  const activeEntrySource = activeVariant?.source ?? entry.source

  // Per-angle source (from the picker) takes precedence; fall back to the
  // bag's single `source` field for older entries that pre-date per-angle.
  const activeSourceUrl = hasColorways
    ? activeColorway?.photoSource ?? activeEntrySource
    : hasAngleData
    ? activePhotoSources?.[angle] ?? activeEntrySource
    : activeEntrySource

  // Deduped list of every Poshmark listing the photos came from, surfaced in
  // the metadata dl so visitors can click through to the originals.
  const uniquePhotoSources = useMemo(() => {
    const fromAngles = Object.values(activePhotoSources ?? {}).filter(
      (u): u is string => Boolean(u),
    )
    const fromColorways = colorways
      .map((c) => c.photoSource)
      .filter((u): u is string => Boolean(u))
    return Array.from(new Set([...fromAngles, ...fromColorways]))
  }, [activePhotoSources, colorways])

  const displayName = entry.region ?? entry.name
  const displayYear = activeVariant?.year ?? entry.year

  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] overflow-hidden">
      <CrumpleOverlay />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-6 pb-12 md:pt-8 md:pb-16">
        <TopNav />

        <Link
          to="/encyclopedia"
          className="inline-flex items-center gap-2 mt-6 font-[var(--tj-body)] tracking-[0.22em] text-[0.65rem] uppercase font-semibold opacity-65 hover:opacity-100 hover:text-[var(--tj-red)] transition-colors"
        >
          <span aria-hidden>←</span> Back to the Encyclopedia
        </Link>

        <header className="text-center mt-2">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            {encyclopediaTypeLabel(entry)}
          </p>
          <h1
            className="text-[var(--tj-red)] text-6xl md:text-8xl leading-none"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            {displayName}
          </h1>
          {design.subtitle && (
            <p
              className="text-[var(--tj-red)] text-3xl md:text-5xl leading-none opacity-90 mt-2"
              style={{ fontFamily: 'var(--tj-script)' }}
            >
              {design.subtitle}
            </p>
          )}

          <MaterialChips materials={entry.materials} className="justify-center mt-6" />

          <div className="mx-auto mt-6 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        {variants.length > 1 && (
          <section className="mt-10 flex flex-col items-center gap-2">
            <p className="font-[var(--tj-body)] tracking-[0.25em] text-[0.6rem] uppercase font-semibold opacity-60">
              Editions
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {variants.map((v) => {
                const isActive = v.id === activeVariantId
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVariantId(v.id)}
                    className={`font-[var(--tj-body)] font-semibold tracking-[0.18em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] px-3.5 py-1.5 transition-colors ${
                      isActive
                        ? 'bg-[var(--tj-ink)] text-[var(--tj-cream)]'
                        : 'bg-transparent text-[var(--tj-ink)] hover:bg-[var(--tj-ink)]/10'
                    }`}
                  >
                    {v.name}
                  </button>
                )
              })}
            </div>
            {activeVariant?.description && (
              <p className="italic text-sm opacity-70 mt-1 max-w-md text-center leading-relaxed">
                {activeVariant.description}
              </p>
            )}
          </section>
        )}

        {/* Photo viewer (only renders when we have at least one reference photo) */}
        {slides.length > 0 ? (
          <section className="mt-10">
            <div
              className="relative mx-auto bg-[var(--tj-cream-dark)] border-2 border-[var(--tj-ink)] overflow-hidden"
              style={{ aspectRatio: '4 / 5', maxWidth: '440px' }}
            >
              <PanelGrain />
              <div
                ref={scrollerRef}
                onScroll={handleScroll}
                className="hide-scrollbar relative z-10 w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
                style={{ touchAction: 'pan-x pan-y' }}
              >
                {slides.map((s, i) => (
                  <div
                    key={`${activeVariantId ?? 'none'}-${i}-${s.url}`}
                    className="snap-start shrink-0 w-full h-full flex items-center justify-center p-6"
                  >
                    <img
                      src={s.url}
                      alt={`${displayName} bag${hasColorways ? `, ${s.label} colorway` : hasAngleData ? `, ${s.label.toLowerCase()} view` : ''}`}
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {((hasAngleData && availableAngles.length > 1) ||
                (hasColorways && colorways.length > 1)) && (
                <>
                  <button
                    type="button"
                    onClick={() => (hasColorways ? cycleColorway(-1) : cycleAngle(-1))}
                    aria-label={hasColorways ? 'Previous colorway' : 'Previous view'}
                    className="absolute z-20 top-1/2 left-2 -translate-y-1/2 w-9 h-12 flex items-center justify-center bg-[var(--tj-ink)]/75 text-[var(--tj-cream)] hover:bg-[var(--tj-ink)] transition-colors text-xl border-2 border-[var(--tj-ink)] leading-none"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => (hasColorways ? cycleColorway(1) : cycleAngle(1))}
                    aria-label={hasColorways ? 'Next colorway' : 'Next view'}
                    className="absolute z-20 top-1/2 right-2 -translate-y-1/2 w-9 h-12 flex items-center justify-center bg-[var(--tj-ink)]/75 text-[var(--tj-cream)] hover:bg-[var(--tj-ink)] transition-colors text-xl border-2 border-[var(--tj-ink)] leading-none"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {activeCaption && (
              <p className="text-center italic mt-4 max-w-sm mx-auto opacity-80 text-sm leading-relaxed">
                {activeCaption}
              </p>
            )}

            {hasAngleData && availableAngles.length > 1 && (
              <div className="flex justify-center gap-2 mt-5 flex-wrap">
                {availableAngles.map((a, i) => {
                  const isActive = a === angle
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => scrollToIdx(i)}
                      className={`font-[var(--tj-body)] font-semibold tracking-[0.2em] text-[0.65rem] uppercase border-2 border-[var(--tj-ink)] px-3 py-1.5 transition-colors ${
                        isActive
                          ? 'bg-[var(--tj-ink)] text-[var(--tj-cream)]'
                          : 'bg-transparent text-[var(--tj-ink)] hover:bg-[var(--tj-ink)]/10'
                      }`}
                    >
                      {ANGLE_LABEL[a]}
                    </button>
                  )
                })}
              </div>
            )}

            {hasColorways && colorways.length > 1 && (
              <div className="flex justify-center gap-2 mt-5 flex-wrap">
                {colorways.map((c, i) => {
                  const isActive = c.id === activeColorway?.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => scrollToIdx(i)}
                      className={`font-[var(--tj-body)] font-semibold tracking-[0.2em] text-[0.65rem] uppercase border-2 border-[var(--tj-ink)] px-3 py-1.5 transition-colors ${
                        isActive
                          ? 'bg-[var(--tj-ink)] text-[var(--tj-cream)]'
                          : 'bg-transparent text-[var(--tj-ink)] hover:bg-[var(--tj-ink)]/10'
                      }`}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            )}

            {activeSourceUrl && (
              <p className="text-center mt-4 text-[0.7rem] tracking-wide opacity-50">
                Photo via{' '}
                <a
                  href={activeSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:opacity-100"
                >
                  {hostnameFromUrl(activeSourceUrl)} ↗
                </a>
              </p>
            )}
          </section>
        ) : (
          <section className="mt-10 text-center">
            <div
              className="relative mx-auto bg-[var(--tj-cream-dark)] border-2 border-dashed border-[var(--tj-ink)]/40 overflow-hidden flex items-center justify-center"
              style={{ aspectRatio: '4 / 5', maxWidth: '440px' }}
            >
              <p className="font-[var(--tj-body)] italic opacity-60 px-6 text-sm">
                No reference photo on file yet.{' '}
                {activeEntrySource && (
                  <>
                    <br />
                    See{' '}
                    <a
                      href={activeEntrySource}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      original listing
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          </section>
        )}

        {entry.note && (
          <aside
            className="mt-12 border-2 border-[var(--tj-ink)] bg-[var(--tj-cream-dark)] px-5 py-4 max-w-2xl mx-auto"
            role="note"
          >
            <p className="font-[var(--tj-body)] tracking-[0.3em] text-[0.65rem] uppercase font-bold mb-2 opacity-80">
              Note
            </p>
            <p className="text-sm leading-relaxed">{entry.note}</p>
            {entry.noteSources && entry.noteSources.length > 0 && (
              <ul className="mt-2 text-sm leading-relaxed space-y-1">
                {entry.noteSources.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      {listingLabelFromUrl(url)} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}

        {/* Design blurb + metadata */}
        <section className="grid md:grid-cols-2 gap-10 mt-16">
          {design.blurb && (
            <div>
              <h2 className="font-[var(--tj-body)] tracking-[0.3em] text-[0.7rem] uppercase font-bold mb-3 opacity-80">
                About this design
              </h2>
              <p className="text-sm md:text-base leading-relaxed">{design.blurb}</p>
            </div>
          )}
          <div>
            <h2 className="font-[var(--tj-body)] tracking-[0.3em] text-[0.7rem] uppercase font-bold mb-3 opacity-80">
              Encyclopedia details
            </h2>
            <dl className="text-sm md:text-base leading-relaxed space-y-1.5">
              {entry.state && (
                <div className="flex gap-3">
                  <dt className="opacity-60 min-w-[5rem]">State</dt>
                  <dd>{entry.state}{entry.region ? ` · ${entry.region}` : ''}</dd>
                </div>
              )}
              {displayYear && (
                <div className="flex gap-3">
                  <dt className="opacity-60 min-w-[5rem]">Released</dt>
                  <dd>{displayYear}</dd>
                </div>
              )}
              {activeVariant && (
                <div className="flex gap-3">
                  <dt className="opacity-60 min-w-[5rem]">Edition</dt>
                  <dd>{activeVariant.name}</dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="opacity-60 min-w-[5rem]">Encyclopedia ID</dt>
                <dd className="font-mono text-sm">{entry.id}</dd>
              </div>
              {activeEntrySource && (
                <div className="flex gap-3">
                  <dt className="opacity-60 min-w-[5rem]">Source</dt>
                  <dd>
                    <a
                      href={activeEntrySource}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 break-all"
                    >
                      reference listing
                    </a>
                  </dd>
                </div>
              )}
              {uniquePhotoSources.length > 0 && (
                <div className="flex gap-3">
                  <dt className="opacity-60 min-w-[5rem]">
                    Photo source{uniquePhotoSources.length > 1 ? 's' : ''}
                  </dt>
                  <dd className="space-y-1">
                    {uniquePhotoSources.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block underline underline-offset-4"
                      >
                        {listingLabelFromUrl(url)} ↗
                      </a>
                    ))}
                  </dd>
                </div>
              )}
              {ownedBag && (
                <div className="flex gap-3">
                  <dt className="opacity-60 min-w-[5rem]">Also in</dt>
                  <dd>
                    <Link
                      to={`/bags/${ownedBag.slug}`}
                      className="underline underline-offset-4"
                    >
                      Parker’s pantry →
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {(prev || next) && (
          <nav className="mt-14 pt-6 border-t border-[var(--tj-ink)]/30 grid grid-cols-2 gap-4 items-start">
            <div>
              {prev && (
                <Link to={`/encyclopedia/${prev.id}`} className="block group">
                  <p className="font-[var(--tj-body)] tracking-[0.25em] text-[0.6rem] uppercase font-semibold opacity-60 mb-1">
                    ← Previous
                  </p>
                  <p
                    className="text-2xl md:text-3xl text-[var(--tj-ink)] group-hover:text-[var(--tj-red)] transition-colors leading-tight"
                    style={{ fontFamily: 'var(--tj-script)' }}
                  >
                    {prev.region ?? prev.name}
                  </p>
                </Link>
              )}
            </div>
            <div className="text-right">
              {next && (
                <Link to={`/encyclopedia/${next.id}`} className="block group">
                  <p className="font-[var(--tj-body)] tracking-[0.25em] text-[0.6rem] uppercase font-semibold opacity-60 mb-1">
                    Next →
                  </p>
                  <p
                    className="text-2xl md:text-3xl text-[var(--tj-ink)] group-hover:text-[var(--tj-red)] transition-colors leading-tight"
                    style={{ fontFamily: 'var(--tj-script)' }}
                  >
                    {next.region ?? next.name}
                  </p>
                </Link>
              )}
            </div>
          </nav>
        )}

      </div>

      <Footer />
    </main>
  )
}

/* ──────────────────────── PIECES ──────────────────────── */

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function listingLabelFromUrl(url: string): string {
  // Make two listings from the same host distinguishable at a glance —
  // Poshmark gets the 24-hex id, Reddit gets the thread slug.
  const host = hostnameFromUrl(url)
  const poshId = url.match(/-?([a-f0-9]{24})(?:\/?$)/i)?.[1]
  if (poshId) return `${host} / ${poshId.slice(0, 8)}…`
  const redditId = url.match(/\/comments\/([a-z0-9]+)\//i)?.[1]
  if (redditId) return `${host} / ${redditId}`
  return host
}

function encyclopediaTypeLabel(entry: EncyclopediaBag): string {
  if (entry.type === 'state') return `${entry.state ?? 'State'} · State Bag`
  if (entry.type === 'special') return 'Special Edition'
  return 'Standard Bag'
}

function LoadingState() {
  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] flex items-center justify-center">
      <p className="italic opacity-50">Pulling the encyclopedia entry…</p>
    </main>
  )
}

function NotInEncyclopedia({ id }: { id?: string }) {
  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] overflow-hidden">
      <CrumpleOverlay />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <TopNav />
        <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
          Not Found
        </p>
        <h1
          className="text-[var(--tj-red)] text-6xl md:text-7xl leading-none"
          style={{ fontFamily: 'var(--tj-script)' }}
        >
          {id ?? 'Unknown'}
        </h1>
        <p className="italic mt-6 opacity-70">
          No encyclopedia entry by that ID.{' '}
          <Link to="/encyclopedia" className="underline underline-offset-4">
            Browse the full encyclopedia
          </Link>{' '}
          to find what you’re looking for.
        </p>
      </div>
    </main>
  )
}

function CrumpleOverlay() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-50"
    >
      <defs>
        <filter id="paperCrumpleEncyclopediaDetail" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="13" />
          <feColorMatrix
            type="matrix"
            values="
              0 0 0 0 0.20
              0 0 0 0 0.14
              0 0 0 0 0.08
              0 0 0 0.40 0"
          />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#paperCrumpleEncyclopediaDetail)" />
    </svg>
  )
}

function PanelGrain() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-25"
    >
      <defs>
        <filter id="panelGrainEncyclopedia" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" />
          <feColorMatrix
            type="matrix"
            values="
              0 0 0 0 0.22
              0 0 0 0 0.16
              0 0 0 0 0.10
              0 0 0 0.30 0"
          />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#panelGrainEncyclopedia)" />
    </svg>
  )
}
