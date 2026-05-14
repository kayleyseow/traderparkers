import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { CatalogBag, CollectionBag, Store } from '../types'
import {
  ANGLE_LABEL,
  ANGLE_ORDER,
  DESIGN_NOTES,
  type Angle,
  type DesignNotes,
  inferAngleMap,
  photoUrl,
} from '../bagPhotos'

const BASE = import.meta.env.BASE_URL

/* ───────────────────────── PAGE ───────────────────────── */

type LoadedData = {
  catalog: CatalogBag[]
  collection: CollectionBag[]
  stores: Map<string, Store>
}

export default function BagDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<LoadedData | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/catalog.json`).then((r) => r.json() as Promise<CatalogBag[]>),
      fetch(`${BASE}data/collection.json`).then((r) => r.json() as Promise<CollectionBag[]>),
      fetch(`${BASE}data/stores.json`).then((r) => r.json() as Promise<Store[]>),
    ])
      .then(([catalog, collection, storeList]) => {
        setData({
          catalog,
          collection,
          stores: new Map(storeList.map((s) => [s.storeNumber, s])),
        })
      })
      .catch(() => setData({ catalog: [], collection: [], stores: new Map() }))
  }, [])

  if (!data) return <LoadingState />

  const bag = data.collection.find((b) => b.slug === slug)
  if (!bag) return <NotLogged slug={slug} />

  const catalogEntry = bag.catalogId
    ? data.catalog.find((c) => c.id === bag.catalogId)
    : undefined
  const store = data.stores.get(bag.storeNumber)
  const design = catalogEntry ? DESIGN_NOTES[catalogEntry.id] ?? {} : {}

  return <BagView bag={bag} catalogEntry={catalogEntry} store={store} design={design} />
}

/* ──────────────────────── VIEW ──────────────────────── */

function BagView({
  bag,
  catalogEntry,
  store,
  design,
}: {
  bag: CollectionBag
  catalogEntry: CatalogBag | undefined
  store: Store | undefined
  design: DesignNotes
}) {
  const angleMap = useMemo(() => inferAngleMap(bag.photos), [bag.photos])
  const availableAngles = ANGLE_ORDER.filter((a) => angleMap[a])
  const initialAngle: Angle = availableAngles[0] ?? 'front'
  const [angle, setAngle] = useState<Angle>(initialAngle)

  const cycleAngle = (dir: 1 | -1) => {
    if (availableAngles.length < 2) return
    const i = availableAngles.indexOf(angle)
    const next = (i + dir + availableAngles.length) % availableAngles.length
    setAngle(availableAngles[next])
  }

  const activeUrl = angleMap[angle] ? photoUrl(angleMap[angle]!) : undefined
  const activeCaption = design.angleCaptions?.[angle]

  const displayName = catalogEntry?.region ?? catalogEntry?.name ?? bag.name ?? bag.slug

  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] overflow-hidden">
      <CrumpleOverlay />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16">
        <TopNav />

        <header className="text-center mt-2">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            {catalogTypeLabel(catalogEntry)}
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

          {catalogEntry && (
            <Link
              to={`/catalog/${catalogEntry.id}`}
              className="inline-flex items-center gap-2 mt-6 font-[var(--tj-body)] tracking-[0.22em] text-[0.65rem] uppercase font-semibold underline-offset-4 hover:underline opacity-75 hover:opacity-100"
            >
              View catalog entry
              <span aria-hidden>→</span>
            </Link>
          )}

          <div className="mx-auto mt-6 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        {/* Photo viewer */}
        <section className="mt-10">
          <div
            className="relative mx-auto bg-[var(--tj-cream-dark)] border-2 border-[var(--tj-ink)] overflow-hidden"
            style={{ aspectRatio: '4 / 5', maxWidth: '440px' }}
          >
            <PanelGrain />
            {activeUrl ? (
              <img
                key={angle}
                src={activeUrl}
                alt={`${displayName} bag, ${ANGLE_LABEL[angle].toLowerCase()} view`}
                className="relative z-10 w-full h-full object-contain p-6 animate-[bagFade_0.35s_ease]"
                draggable={false}
              />
            ) : (
              <div className="relative z-10 w-full h-full flex items-center justify-center text-[var(--tj-ink)]/30 text-4xl">
                ✦
              </div>
            )}

            {availableAngles.length > 1 && (
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

          {availableAngles.length > 1 && (
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

        {/* Story / metadata */}
        <section className="grid md:grid-cols-2 gap-10 mt-16">
          {design.blurb && (
            <div>
              <h2 className="font-[var(--tj-body)] tracking-[0.3em] text-[0.7rem] uppercase font-bold mb-3 opacity-80">
                About this bag
              </h2>
              <p className="text-sm md:text-base leading-relaxed">{design.blurb}</p>
            </div>
          )}
          {bag.memory && (
            <div>
              <h2 className="font-[var(--tj-body)] tracking-[0.3em] text-[0.7rem] uppercase font-bold mb-3 opacity-80">
                Parker’s note
              </h2>
              <p className="italic text-sm md:text-base leading-relaxed">
                “{bag.memory}”
              </p>
            </div>
          )}
        </section>

        {/* Acquisition strip */}
        <footer className="mt-14 pt-6 border-t border-[var(--tj-ink)]/30 flex items-center justify-between font-[var(--tj-body)] tracking-[0.22em] font-semibold text-[0.65rem] uppercase opacity-75 flex-wrap gap-2">
          <span>Acquired {formatDate(bag.dateAcquired)}</span>
          <span>{storeLabel(store, bag.storeNumber)}</span>
        </footer>
      </div>

      <style>{`
        @keyframes bagFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}

/* ──────────────────────── HELPERS ──────────────────────── */

function catalogTypeLabel(entry: CatalogBag | undefined): string {
  if (!entry) return 'Uncataloged Bag'
  if (entry.type === 'state') return `${entry.state ?? 'State'} · State Bag`
  if (entry.type === 'special') return 'Special Edition'
  if (entry.type === 'seasonal') return 'Seasonal Bag'
  return 'Standard Bag'
}

function storeLabel(store: Store | undefined, storeNumber: string): string {
  if (!store) return `Store #${storeNumber}`
  const city = store.name ?? store.city ?? ''
  const state = store.state ?? ''
  return [city, state].filter(Boolean).join(', ')
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

/* ──────────────────────── PIECES ──────────────────────── */

function TopNav() {
  return (
    <nav className="mb-10 flex items-center justify-between flex-wrap gap-3">
      <Link
        to="/collection"
        className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] px-4 py-2 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
      >
        ← The Collection
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/catalog"
          className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Catalog
        </Link>
        <Link
          to="/about"
          className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
        >
          About
        </Link>
      </div>
    </nav>
  )
}

function LoadingState() {
  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] flex items-center justify-center">
      <p className="italic opacity-50">Unpacking the bag…</p>
    </main>
  )
}

function NotLogged({ slug }: { slug?: string }) {
  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] overflow-hidden">
      <CrumpleOverlay />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center">
        <TopNav />
        <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
          Not Yet Logged
        </p>
        <h1
          className="text-[var(--tj-red)] text-6xl md:text-7xl leading-none"
          style={{ fontFamily: 'var(--tj-script)' }}
        >
          {slug ?? 'Unknown Bag'}
        </h1>
        <p className="italic mt-6 opacity-70">
          Parker hasn’t added this bag to the collection yet. Browse the{' '}
          <Link to="/collection" className="underline underline-offset-4">
            collection
          </Link>{' '}
          to see what’s logged so far, or{' '}
          <Link to="/catalog" className="underline underline-offset-4">
            the catalog
          </Link>{' '}
          for every Trader Joe’s bag we know about.
        </p>
      </div>
    </main>
  )
}

/* Lighter crumple overlay, same as Gallery / Catalog. */
function CrumpleOverlay() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-30"
    >
      <defs>
        <filter id="paperCrumpleBagDetail" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="9">
            <animate
              attributeName="seed"
              values="9;21;13;26;9"
              keyTimes="0;0.25;0.5;0.75;1"
              dur="60s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix
            type="matrix"
            values="
              0 0 0 0 0.20
              0 0 0 0 0.14
              0 0 0 0 0.08
              0 0 0 0.28 0"
          />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#paperCrumpleBagDetail)" />
    </svg>
  )
}

/* Subtle paper grain inside the bag-display panel. */
function PanelGrain() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-25"
    >
      <defs>
        <filter id="panelGrain" x="0" y="0" width="100%" height="100%">
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
      <rect width="100%" height="100%" filter="url(#panelGrain)" />
    </svg>
  )
}
