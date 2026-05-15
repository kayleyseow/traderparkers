import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { EncyclopediaBag, PantryBag, ProgressStats, Store } from '../types'
import TopNav from '../TopNav'
import Footer from '../Footer'

const BASE = import.meta.env.BASE_URL

export default function Pantry() {
  const [bags, setBags] = useState<PantryBag[] | null>(null)
  const [stores, setStores] = useState<Map<string, Store>>(new Map())
  const [stats, setStats] = useState<ProgressStats | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/pantry.json`).then((r) => r.json() as Promise<PantryBag[]>),
      fetch(`${BASE}data/stores.json`).then((r) => r.json() as Promise<Store[]>),
      fetch(`${BASE}data/encyclopedia.json`).then((r) => r.json() as Promise<EncyclopediaBag[]>),
    ])
      .then(([pantry, storeList, encyclopedia]) => {
        setBags(pantry)
        setStores(new Map(storeList.map((s) => [s.storeNumber, s])))

        const totalStates = new Set(
          encyclopedia
            .filter((b) => b.type === 'state' && b.stateCode)
            .map((b) => b.stateCode as string),
        ).size
        const totalSpecials = encyclopedia.filter((b) => b.type === 'special').length

        const byId = new Map(encyclopedia.map((b) => [b.id, b]))
        const collectedStateCodes = new Set<string>()
        let specialsCollected = 0
        for (const bag of pantry) {
          if (!bag.encyclopediaId) continue
          const entry = byId.get(bag.encyclopediaId)
          if (!entry) continue
          if (entry.type === 'state' && entry.stateCode) {
            collectedStateCodes.add(entry.stateCode)
          } else if (entry.type === 'special') {
            specialsCollected++
          }
        }

        setStats({
          totalBags: pantry.length,
          statesCollected: collectedStateCodes.size,
          totalStates,
          specialsCollected,
          totalSpecials,
        })
      })
      .catch(() => setBags([]))
  }, [])

  return (
    <main
      id="pantry"
      className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] px-6 pt-6 pb-12 md:pt-8 md:pb-16 overflow-hidden"
    >
      <CrumpleOverlay />

      <div className="relative z-10 max-w-6xl mx-auto">
        <TopNav />

        <header className="text-center mb-14">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            The Pantry
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

        {stats && <StatsRow stats={stats} />}

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
      <Footer />
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
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-50"
    >
      <defs>
        <filter id="paperCrumpleLight" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="3"
            seed="5"
          />
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
      <rect width="100%" height="100%" filter="url(#paperCrumpleLight)" />
    </svg>
  )
}

function StatsRow({ stats }: { stats: ProgressStats }) {
  return (
    <div className="flex items-center justify-center gap-10 py-3 mb-12 mx-auto w-fit border-y-2 border-[var(--tj-ink)] font-[var(--tj-body)] font-semibold tracking-[0.18em] text-sm">
      <Stat value={String(stats.totalBags)} label="Bags Logged" />
      <div className="w-px h-6 bg-[var(--tj-ink)]" />
      <Stat
        value={`${stats.statesCollected}/${stats.totalStates || '—'}`}
        label="States"
      />
      <div className="w-px h-6 bg-[var(--tj-ink)]" />
      <Stat
        value={`${stats.specialsCollected}/${stats.totalSpecials || '—'}`}
        label="Special Editions"
      />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <strong className="block text-3xl leading-none text-[var(--tj-red)] font-bold tracking-normal">
        {value}
      </strong>
      <span className="text-[0.7rem]">{label.toUpperCase()}</span>
    </div>
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
        Parker hasn't added any bags to the pantry. <br />
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

function BagCard({ bag, store }: { bag: PantryBag; store: Store | undefined }) {
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
