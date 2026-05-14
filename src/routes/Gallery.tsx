import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { CollectionBag, Store } from '../types'

const BASE = import.meta.env.BASE_URL

export default function Gallery() {
  const [bags, setBags] = useState<CollectionBag[] | null>(null)
  const [stores, setStores] = useState<Map<string, Store>>(new Map())

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/collection.json`).then((r) => r.json() as Promise<CollectionBag[]>),
      fetch(`${BASE}data/stores.json`).then((r) => r.json() as Promise<Store[]>),
    ])
      .then(([collection, storeList]) => {
        setBags(collection)
        setStores(new Map(storeList.map((s) => [s.storeNumber, s])))
      })
      .catch(() => setBags([]))
  }, [])

  return (
    <main
      id="collection"
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
            <Link
              to="/admin"
              className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-4 py-2 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors"
            >
              Parker Only
            </Link>
          </div>
        </nav>

        <header className="text-center mb-14">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            The Collection
          </p>
          <h1
            className="text-[var(--tj-red)] text-6xl md:text-7xl leading-none"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            Every Bag, Every Story
          </h1>
          <p className="font-[var(--tj-body)] italic text-base md:text-lg mt-4 max-w-md mx-auto opacity-75">
            Trader Joe's totes, gathered one grocery run at a time.
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        {bags === null && <LoadingState />}
        {bags && bags.length === 0 && <EmptyState />}
        {bags && bags.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bags.map((bag) => (
              <li key={bag.slug}>
                <BagCard bag={bag} store={stores.get(bag.storeNumber)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

/* Lighter version of the landing's crumple — same filter, less opacity so
   it reads as gentle paper grain over the cream background. */
function CrumpleOverlay() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-30"
    >
      <defs>
        <filter id="paperCrumpleLight" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="3"
            seed="5"
          >
            <animate
              attributeName="seed"
              values="5;17;9;22;5"
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
      <rect width="100%" height="100%" filter="url(#paperCrumpleLight)" />
    </svg>
  )
}

function LoadingState() {
  return (
    <p className="text-center italic opacity-50 py-20">Unpacking the bags…</p>
  )
}

function EmptyState() {
  return (
    <div className="max-w-md mx-auto text-center py-12 border-2 border-dashed border-[var(--tj-ink)]/40 p-10 bg-[var(--tj-kraft)]/15">
      <div className="text-5xl mb-4 select-none" aria-hidden>🛍️</div>
      <h3 className="font-[var(--tj-body)] tracking-[0.25em] text-sm uppercase font-bold mb-3">
        No Bags Logged Yet
      </h3>
      <p className="italic text-sm mb-6">
        Parker hasn't added any bags to the collection. <br />
        First one's just a click away.
      </p>
      <Link
        to="/admin"
        className="inline-block font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-5 py-2.5 hover:-translate-y-0.5 transition-transform"
      >
        Log the First Bag
      </Link>
    </div>
  )
}

function BagCard({ bag, store }: { bag: CollectionBag; store: Store | undefined }) {
  const hero = bag.photos[0]
  const heroUrl = hero?.startsWith('http') ? hero : `${BASE}${hero?.replace(/^\//, '')}`
  return (
    <Link
      to={`/bags/${bag.slug}`}
      className="group block bg-[var(--tj-kraft)] border-2 border-[var(--tj-ink)] hover:-translate-y-1 transition-transform"
    >
      <div className="aspect-square bg-[var(--tj-kraft-dark)] border-b-2 border-[var(--tj-ink)] overflow-hidden">
        {hero ? (
          <img
            src={heroUrl}
            alt={bag.name ?? bag.slug}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--tj-ink)]/30 text-4xl">
            ✦
          </div>
        )}
      </div>
      <div className="p-4 space-y-1.5">
        <h3 className="font-[var(--tj-body)] text-xl font-bold leading-tight text-[var(--tj-ink)]">
          {bag.name ?? 'Untitled Bag'}
        </h3>
        <p className="font-[var(--tj-body)] tracking-[0.18em] text-[0.7rem] uppercase font-semibold opacity-75">
          {store ? `${store.name}, ${store.state}` : `Store #${bag.storeNumber}`}
        </p>
        <p className="italic text-sm opacity-60">{formatDate(bag.dateAcquired)}</p>
      </div>
    </Link>
  )
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
