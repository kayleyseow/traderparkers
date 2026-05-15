import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { EncyclopediaBag, PantryBag } from '../types'
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
      fetch(`${BASE}data/encyclopedia.json`).then((r) => r.json() as Promise<EncyclopediaBag[]>),
      fetch(`${BASE}data/pantry.json`).then((r) => r.json() as Promise<PantryBag[]>),
    ])
      .then(([encyclopedia, pantry]) => setData({ encyclopedia, pantry }))
      .catch(() => setData({ encyclopedia: [], pantry: [] }))
  }, [])

  if (!data) return <LoadingState />

  const entry = data.encyclopedia.find((c) => c.id === id)
  if (!entry) return <NotInEncyclopedia id={id} />

  const ownedBag = data.pantry.find((b) => b.encyclopediaId === entry.id)

  // Prev/next within the state-type subset only (the "locales").
  // Non-state entries get no prev/next nav.
  const locales = data.encyclopedia.filter((c) => c.type === 'state')
  const idx = locales.findIndex((c) => c.id === entry.id)
  const prev = idx > 0 ? locales[idx - 1] : undefined
  const next = idx >= 0 && idx < locales.length - 1 ? locales[idx + 1] : undefined

  return <EncyclopediaView entry={entry} ownedBag={ownedBag} prev={prev} next={next} />
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

  // Encyclopedia reference photos first; fall back to the single referencePhoto.
  const photos = useMemo(() => {
    if (entry.referencePhotos?.length) return entry.referencePhotos
    if (entry.referencePhoto) return [entry.referencePhoto]
    return []
  }, [entry.referencePhotos, entry.referencePhoto])

  const angleMap = useMemo(() => inferAngleMap(photos), [photos])
  const availableAngles = ANGLE_ORDER.filter((a) => angleMap[a])
  const hasAngleData = availableAngles.length > 0
  const initialAngle: Angle = availableAngles[0] ?? 'front'
  const [angle, setAngle] = useState<Angle>(initialAngle)

  const cycleAngle = (dir: 1 | -1) => {
    if (availableAngles.length < 2) return
    const i = availableAngles.indexOf(angle)
    const next = (i + dir + availableAngles.length) % availableAngles.length
    setAngle(availableAngles[next])
  }

  // For photos that don't follow the angle-naming convention (single
  // listing-style photo), just show the first one.
  const fallbackPhoto = !hasAngleData && photos.length > 0 ? photos[0] : undefined
  const activeUrl = hasAngleData
    ? angleMap[angle]
      ? photoUrl(angleMap[angle]!)
      : undefined
    : fallbackPhoto
    ? photoUrl(fallbackPhoto)
    : undefined
  const activeCaption = hasAngleData ? design.angleCaptions?.[angle] : undefined

  const displayName = entry.region ?? entry.name

  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] overflow-hidden">
      <CrumpleOverlay />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16">
        <TopNav backTo="/encyclopedia" backLabel="The Encyclopedia" />

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

        {/* Photo viewer (only renders when we have at least one reference photo) */}
        {activeUrl ? (
          <section className="mt-10">
            <div
              className="relative mx-auto bg-[var(--tj-cream-dark)] border-2 border-[var(--tj-ink)] overflow-hidden"
              style={{ aspectRatio: '4 / 5', maxWidth: '440px' }}
            >
              <PanelGrain />
              <img
                key={hasAngleData ? angle : 'single'}
                src={activeUrl}
                alt={`${displayName} bag${hasAngleData ? `, ${ANGLE_LABEL[angle].toLowerCase()} view` : ''}`}
                className="relative z-10 w-full h-full object-contain p-6 animate-[bagFade_0.35s_ease]"
                draggable={false}
              />

              {hasAngleData && availableAngles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => cycleAngle(-1)}
                    aria-label="Previous view"
                    className="absolute z-20 top-1/2 left-2 -translate-y-1/2 w-9 h-12 flex items-center justify-center bg-[var(--tj-ink)]/75 text-[var(--tj-cream)] hover:bg-[var(--tj-ink)] transition-colors text-xl border-2 border-[var(--tj-ink)] leading-none"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => cycleAngle(1)}
                    aria-label="Next view"
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
                {availableAngles.map((a) => {
                  const isActive = a === angle
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAngle(a)}
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
          </section>
        ) : (
          <section className="mt-10 text-center">
            <div
              className="relative mx-auto bg-[var(--tj-cream-dark)] border-2 border-dashed border-[var(--tj-ink)]/40 overflow-hidden flex items-center justify-center"
              style={{ aspectRatio: '4 / 5', maxWidth: '440px' }}
            >
              <p className="font-[var(--tj-body)] italic opacity-60 px-6 text-sm">
                No reference photo on file yet.{' '}
                {entry.source && (
                  <>
                    <br />
                    See{' '}
                    <a
                      href={entry.source}
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
              {entry.year && (
                <div className="flex gap-3">
                  <dt className="opacity-60 min-w-[5rem]">Released</dt>
                  <dd>{entry.year}</dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="opacity-60 min-w-[5rem]">Encyclopedia ID</dt>
                <dd className="font-mono text-sm">{entry.id}</dd>
              </div>
              {entry.source && (
                <div className="flex gap-3">
                  <dt className="opacity-60 min-w-[5rem]">Source</dt>
                  <dd>
                    <a
                      href={entry.source}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 break-all"
                    >
                      reference listing
                    </a>
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

        <footer className="mt-10 pt-6 border-t border-[var(--tj-ink)]/30 flex items-center justify-between font-[var(--tj-body)] tracking-[0.22em] font-semibold text-[0.65rem] uppercase opacity-75 flex-wrap gap-2">
          <Link to="/encyclopedia" className="underline underline-offset-4 hover:opacity-100">
            ← Back to the encyclopedia
          </Link>
          {entry.type !== 'state' && (
            <span>{encyclopediaTypeLabel(entry)}</span>
          )}
        </footer>
      </div>

      <style>{`
        @keyframes bagFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Footer />
    </main>
  )
}

/* ──────────────────────── PIECES ──────────────────────── */

function encyclopediaTypeLabel(entry: EncyclopediaBag): string {
  if (entry.type === 'state') return `${entry.state ?? 'State'} · State Bag`
  if (entry.type === 'special') return 'Special Edition'
  if (entry.type === 'seasonal') return 'Seasonal Bag'
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
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center">
        <TopNav backTo="/encyclopedia" backLabel="The Encyclopedia" />
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
