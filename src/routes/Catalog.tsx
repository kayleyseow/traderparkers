import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { BagType, CatalogBag, CollectionBag } from '../types'
import { US_LOCALES } from '../usLocales'
import SuggestForm from './catalog/SuggestForm'

const BASE = import.meta.env.BASE_URL

const NON_LOCATION_GROUPS: { type: BagType; label: string; blurb: string }[] = [
  {
    type: 'special',
    label: 'Special Editions',
    blurb: 'Themed bags that aren’t tied to a state — pickle, sardine, cheese, wine.',
  },
  {
    type: 'seasonal',
    label: 'Seasonal',
    blurb: 'Released around a holiday or season; designs change year to year.',
  },
  {
    type: 'standard',
    label: 'Standard Bags',
    blurb: 'The everyday lineup — insulated, mini canvas, washable paper, and more.',
  },
]

export default function Catalog() {
  const [catalog, setCatalog] = useState<CatalogBag[] | null>(null)
  const [collection, setCollection] = useState<CollectionBag[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/catalog.json`).then((r) => r.json() as Promise<CatalogBag[]>),
      fetch(`${BASE}data/collection.json`).then((r) => r.json() as Promise<CollectionBag[]>),
    ])
      .then(([cat, col]) => {
        setCatalog(cat)
        setCollection(col)
      })
      .catch(() => setCatalog([]))
  }, [])

  const ownedByCatalogId = useMemo(() => {
    const map = new Map<string, CollectionBag>()
    for (const bag of collection) {
      if (bag.catalogId) map.set(bag.catalogId, bag)
    }
    return map
  }, [collection])

  const byState = useMemo(() => {
    const map = new Map<string, CatalogBag[]>()
    if (!catalog) return map
    for (const bag of catalog) {
      if (bag.type !== 'state' || !bag.stateCode) continue
      const list = map.get(bag.stateCode) ?? []
      list.push(bag)
      map.set(bag.stateCode, list)
    }
    return map
  }, [catalog])

  const byType = useMemo(() => {
    const map = new Map<BagType, CatalogBag[]>()
    if (!catalog) return map
    for (const bag of catalog) {
      if (bag.type === 'state') continue
      const list = map.get(bag.type) ?? []
      list.push(bag)
      map.set(bag.type, list)
    }
    return map
  }, [catalog])

  const localesWithBags = useMemo(
    () => US_LOCALES.filter((l) => byState.has(l.code)).length,
    [byState],
  )
  const totalKnownBags = catalog?.length ?? 0

  return (
    <main
      id="catalog"
      className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] px-6 py-12 md:py-16 overflow-hidden"
    >
      <CrumpleOverlay />

      <div className="relative z-10 max-w-6xl mx-auto">
        <nav className="mb-10 flex items-center justify-between flex-wrap gap-3">
          <Link
            to="/"
            className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] px-4 py-2 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
          >
            ← The Bazaar
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/collection"
              className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
            >
              Collection
            </Link>
            <Link
              to="/about"
              className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
            >
              About
            </Link>
            <Link
              to="/admin"
              className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-4 py-2 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors"
            >
              Parker Only
            </Link>
          </div>
        </nav>

        <header className="text-center mb-10">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            The Bag Catalog
          </p>
          <h1
            className="text-[var(--tj-red)] text-6xl md:text-7xl leading-none"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            Every Bag We Know About
          </h1>
          <p className="font-[var(--tj-body)] italic text-base md:text-lg mt-4 max-w-xl mx-auto opacity-75">
            Trader Joe's regional totes — the ones in the wild, waiting to be found.
            This list is hand-curated and almost certainly incomplete; spot a missing
            one? Tell Parker.
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        {catalog === null ? (
          <p className="text-center italic opacity-50 py-20">Sorting the catalog…</p>
        ) : (
          <>
            <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-3 mb-12 font-[var(--tj-body)] tracking-[0.25em] text-[0.7rem] uppercase font-semibold">
              <span>
                <strong className="text-2xl tracking-normal text-[var(--tj-red)] align-middle mr-2"
                  style={{ fontFamily: 'var(--tj-script)' }}>
                  {totalKnownBags}
                </strong>
                bags known
              </span>
              <span aria-hidden className="opacity-30">·</span>
              <span>
                <strong className="text-2xl tracking-normal text-[var(--tj-red)] align-middle mr-2"
                  style={{ fontFamily: 'var(--tj-script)' }}>
                  {localesWithBags}
                </strong>
                of 51 locales represented
              </span>
            </div>

            <div className="space-y-10">
              {US_LOCALES.filter((locale) => byState.has(locale.code)).map((locale) => (
                <StateSection
                  key={locale.code}
                  code={locale.code}
                  name={locale.name}
                  bags={byState.get(locale.code)!}
                  ownedByCatalogId={ownedByCatalogId}
                />
              ))}
            </div>

            {NON_LOCATION_GROUPS.some((g) => byType.has(g.type)) && (
              <>
                <div className="my-16 flex items-center gap-6">
                  <div className="flex-1 h-px bg-[var(--tj-ink)]/40" />
                  <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold opacity-70">
                    Beyond the States
                  </p>
                  <div className="flex-1 h-px bg-[var(--tj-ink)]/40" />
                </div>

                <div className="space-y-10">
                  {NON_LOCATION_GROUPS.map((group) => {
                    const bags = byType.get(group.type)
                    if (!bags || bags.length === 0) return null
                    return (
                      <TypeSection
                        key={group.type}
                        label={group.label}
                        blurb={group.blurb}
                        bags={bags}
                        ownedByCatalogId={ownedByCatalogId}
                      />
                    )
                  })}
                </div>
              </>
            )}

            <div className="my-16 flex items-center gap-6">
              <div className="flex-1 h-px bg-[var(--tj-ink)]/40" />
              <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold opacity-70">
                Suggest a Bag
              </p>
              <div className="flex-1 h-px bg-[var(--tj-ink)]/40" />
            </div>
            <SuggestForm />
          </>
        )}
      </div>
    </main>
  )
}

function StateSection({
  code,
  name,
  bags,
  ownedByCatalogId,
}: {
  code: string
  name: string
  bags: CatalogBag[]
  ownedByCatalogId: Map<string, CollectionBag>
}) {
  return (
    <section>
      <header className="flex items-baseline gap-4 mb-3 border-b border-[var(--tj-ink)]/30 pb-2">
        <h2
          className="text-3xl md:text-4xl text-[var(--tj-ink)]"
          style={{ fontFamily: 'var(--tj-script)' }}
        >
          {name}
        </h2>
        <span className="font-[var(--tj-body)] tracking-[0.3em] text-[0.65rem] uppercase font-semibold opacity-60">
          {code}
        </span>
        <span className="ml-auto font-[var(--tj-body)] italic text-sm opacity-60">
          {bags.length} {bags.length === 1 ? 'design' : 'designs'}
        </span>
      </header>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bags.map((bag) => (
          <li key={bag.id}>
            <CatalogCard bag={bag} ownedBag={ownedByCatalogId.get(bag.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function TypeSection({
  label,
  blurb,
  bags,
  ownedByCatalogId,
}: {
  label: string
  blurb: string
  bags: CatalogBag[]
  ownedByCatalogId: Map<string, CollectionBag>
}) {
  return (
    <section>
      <header className="flex items-baseline gap-4 mb-1 border-b border-[var(--tj-ink)]/30 pb-2">
        <h2
          className="text-3xl md:text-4xl text-[var(--tj-ink)]"
          style={{ fontFamily: 'var(--tj-script)' }}
        >
          {label}
        </h2>
        <span className="ml-auto font-[var(--tj-body)] italic text-sm opacity-60">
          {bags.length} {bags.length === 1 ? 'design' : 'designs'}
        </span>
      </header>
      <p className="font-[var(--tj-body)] italic text-sm opacity-70 mb-4">{blurb}</p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bags.map((bag) => (
          <li key={bag.id}>
            <CatalogCard bag={bag} ownedBag={ownedByCatalogId.get(bag.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CatalogCard({
  bag,
  ownedBag,
}: {
  bag: CatalogBag
  ownedBag: CollectionBag | undefined
}) {
  return (
    <Link
      id={`bag-${bag.id}`}
      to={`/catalog/${bag.id}`}
      className="relative border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] p-4 h-full block scroll-mt-24 hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(42,31,20,0.2)] transition-transform"
    >
      <h3 className="font-[var(--tj-body)] text-xl font-bold leading-tight">
        {bag.region ?? bag.name}
      </h3>
      {bag.region && (
        <p className="font-[var(--tj-body)] tracking-[0.18em] text-[0.7rem] uppercase font-semibold opacity-60 mt-0.5">
          {bag.state}
        </p>
      )}
      {bag.year && (
        <p className="font-[var(--tj-body)] italic text-sm opacity-60 mt-2">
          Released {bag.year}
        </p>
      )}
      {bag.description && (
        <p className="font-[var(--tj-body)] text-sm opacity-75 mt-2">
          {bag.description}
        </p>
      )}
      {ownedBag && (
        <p
          className="font-[var(--tj-body)] tracking-[0.22em] text-[0.6rem] uppercase font-semibold mt-3 text-[var(--tj-red)]/80"
          aria-label="Also in Parker's collection"
        >
          ★ Also in Parker’s collection
        </p>
      )}
    </Link>
  )
}

function CrumpleOverlay() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-30"
    >
      <defs>
        <filter id="paperCrumpleCatalog" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="3"
            seed="11"
          >
            <animate
              attributeName="seed"
              values="11;3;19;7;11"
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
      <rect width="100%" height="100%" filter="url(#paperCrumpleCatalog)" />
    </svg>
  )
}
