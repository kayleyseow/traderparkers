import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type {
  BagType,
  CategoryVisibility,
  EncyclopediaBag,
  PantryBag,
  ProgressStats,
  Store,
} from '../types'
import { DEFAULT_VISIBILITY } from '../types'
import TopNav from '../TopNav'
import Footer from '../Footer'
import StoreChip from '../StoreChip'
import { defaultReferencePhotos } from '../bagPhotos'

const BASE = import.meta.env.BASE_URL

type SortOrder = 'newest' | 'oldest'
type TypeFilter = BagType | 'all'

export default function Pantry() {
  const [bags, setBags] = useState<PantryBag[] | null>(null)
  const [stores, setStores] = useState<Map<string, Store>>(new Map())
  const [encyclopediaById, setEncyclopediaById] = useState<Map<string, EncyclopediaBag>>(new Map())
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [visibility, setVisibility] = useState<CategoryVisibility>(DEFAULT_VISIBILITY)
  const [sort, setSort] = useState<SortOrder>('newest')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/pantry.json`, { cache: 'no-cache' }).then((r) => r.json() as Promise<PantryBag[]>),
      fetch(`${BASE}data/stores.json`, { cache: 'no-cache' }).then((r) => r.json() as Promise<Store[]>),
      fetch(`${BASE}data/encyclopedia.json`, { cache: 'no-cache' }).then((r) => r.json() as Promise<EncyclopediaBag[]>),
    ])
      .then(([pantry, storeList, encyclopedia]) => {
        setBags(pantry)
        setStores(new Map(storeList.map((s) => [s.storeNumber, s])))

        const byId = new Map(encyclopedia.map((b) => [b.id, b]))
        setEncyclopediaById(byId)

        // States are deduped by stateCode (one row per locale); the other
        // three types are simple per-bag tallies against the encyclopedia.
        const totalStateCodes = new Set<string>()
        const totals: Record<Exclude<BagType, 'state'>, number> = {
          special: 0,
          standard: 0,
        }
        for (const bag of encyclopedia) {
          if (bag.type === 'state') {
            if (bag.stateCode) totalStateCodes.add(bag.stateCode)
          } else {
            totals[bag.type]++
          }
        }

        const collectedStateCodes = new Set<string>()
        const collected: Record<Exclude<BagType, 'state'>, number> = {
          special: 0,
          standard: 0,
        }
        for (const bag of pantry) {
          if (!bag.encyclopediaId) continue
          const entry = byId.get(bag.encyclopediaId)
          if (!entry) continue
          if (entry.type === 'state') {
            if (entry.stateCode) collectedStateCodes.add(entry.stateCode)
          } else {
            collected[entry.type]++
          }
        }

        setStats({
          totalBags: pantry.length,
          byType: {
            state: { collected: collectedStateCodes.size, total: totalStateCodes.size },
            special: { collected: collected.special, total: totals.special },
            standard: { collected: collected.standard, total: totals.standard },
          },
        })
      })
      .catch(() => setBags([]))

    // Missing visibility.json just means "show everything" — defaults cover it.
    fetch(`${BASE}data/visibility.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? (r.json() as Promise<CategoryVisibility>) : null))
      .then((v) => {
        if (v) setVisibility({ ...DEFAULT_VISIBILITY, ...v })
      })
      .catch(() => {
        /* keep defaults */
      })
  }, [])

  const availableTypes = useMemo(() => {
    if (!bags) return [] as BagType[]
    const present = new Set<BagType>()
    for (const bag of bags) {
      if (!bag.encyclopediaId) continue
      const entry = encyclopediaById.get(bag.encyclopediaId)
      if (entry) present.add(entry.type)
    }
    return TYPE_ORDER.filter((t) => present.has(t))
  }, [bags, encyclopediaById])

  const filteredBags = useMemo(() => {
    if (!bags) return [] as PantryBag[]
    const q = query.trim().toLowerCase()
    const matches = bags.filter((bag) => {
      const entry = bag.encyclopediaId ? encyclopediaById.get(bag.encyclopediaId) : undefined
      if (typeFilter !== 'all' && entry?.type !== typeFilter) return false
      if (!q) return true
      const haystack = [
        bag.name ?? '',
        bag.memory ?? '',
        entry?.name ?? '',
        entry?.state ?? '',
        entry?.region ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
    const sorted = [...matches].sort((a, b) => {
      const diff = new Date(b.dateAcquired).getTime() - new Date(a.dateAcquired).getTime()
      return sort === 'newest' ? diff : -diff
    })
    return sorted
  }, [bags, encyclopediaById, typeFilter, query, sort])

  const filtersActive = typeFilter !== 'all' || query.trim() !== ''

  function clearFilters() {
    setTypeFilter('all')
    setQuery('')
  }

  return (
    <main
      id="pantry"
      className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] px-6 pt-6 md:pt-8 overflow-hidden"
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

        {stats && <StatsRow stats={stats} visibility={visibility} />}

        {bags === null && <LoadingState />}
        {bags && bags.length === 0 && <EmptyState />}
        {bags && bags.length > 0 && (
          <>
            <FilterBar
              availableTypes={availableTypes}
              typeFilter={typeFilter}
              onTypeFilter={setTypeFilter}
              query={query}
              onQuery={setQuery}
              sort={sort}
              onSort={setSort}
              visibleCount={filteredBags.length}
              totalCount={bags.length}
              filtersActive={filtersActive}
            />
            {filteredBags.length === 0 ? (
              <NoMatchesState onClear={clearFilters} />
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-14 md:gap-y-16">
                {filteredBags.map((bag, index) => (
                  <li key={bag.slug}>
                    <BagCard
                      bag={bag}
                      store={stores.get(bag.storeNumber)}
                      encyclopediaEntry={
                        bag.encyclopediaId ? encyclopediaById.get(bag.encyclopediaId) : undefined
                      }
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
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

const CATEGORY_STAT_ORDER: { key: BagType; label: string }[] = [
  { key: 'state', label: 'States' },
  { key: 'special', label: 'Special Editions' },
  { key: 'standard', label: 'Standard Bags' },
]

function StatsRow({
  stats,
  visibility,
}: {
  stats: ProgressStats
  visibility: CategoryVisibility
}) {
  const visibleCategories = CATEGORY_STAT_ORDER.filter(({ key }) => visibility[key])
  type Cell = {
    key: string
    value: string
    label: string
    collected?: number
    total?: number
  }
  const cells: Cell[] = [
    { key: 'totalBags', value: String(stats.totalBags), label: 'Bags Logged' },
    ...visibleCategories.map(({ key, label }) => {
      const { collected, total } = stats.byType[key]
      return {
        key,
        value: `${collected}/${total || '—'}`,
        label,
        collected,
        total,
      }
    }),
  ]

  return (
    <div className="mb-12 mx-auto w-fit max-w-full border-y-2 border-[var(--tj-ink)] font-[var(--tj-body)] font-semibold tracking-[0.18em] text-sm">
      {/* Mobile: vertical stack with horizontal dividers, full-width bars. */}
      <div className="sm:hidden flex flex-col divide-y-2 divide-[var(--tj-ink)] w-[20rem] max-w-[88vw] mx-auto">
        {cells.map((cell) => (
          <div key={cell.key} className="py-4 px-6">
            <Stat
              value={cell.value}
              label={cell.label}
              collected={cell.collected}
              total={cell.total}
            />
          </div>
        ))}
      </div>

      {/* sm and up: horizontal row with vertical dividers. */}
      <div className="hidden sm:flex flex-wrap items-stretch justify-center gap-x-8 gap-y-4 py-4 px-6">
        {cells.map((cell, i) => (
          <div key={cell.key} className="flex items-stretch gap-8">
            {i > 0 && <div className="w-px self-stretch bg-[var(--tj-ink)]" aria-hidden />}
            <Stat
              value={cell.value}
              label={cell.label}
              collected={cell.collected}
              total={cell.total}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  collected,
  total,
}: {
  value: string
  label: string
  collected?: number
  total?: number
}) {
  const hasProgress = typeof collected === 'number' && typeof total === 'number' && total > 0
  return (
    <div className="text-center min-w-[6.5rem]">
      <strong className="block text-3xl leading-none text-[var(--tj-red)] font-bold tracking-normal">
        {value}
      </strong>
      <span className="text-[0.7rem]">{label.toUpperCase()}</span>
      {hasProgress && (
        <ProgressBar collected={collected!} total={total!} label={label} />
      )}
    </div>
  )
}

/* Thin progress bar that eases from 0% → (collected/total)% on mount.
   We delay one frame after mounting so the browser sees the transition
   from 0 — setting the target value synchronously would skip the anim. */
function ProgressBar({
  collected,
  total,
  label,
}: {
  collected: number
  total: number
  label: string
}) {
  const target = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(target))
    return () => cancelAnimationFrame(id)
  }, [target])

  return (
    <div className="mt-2">
      <div
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuenow={target}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full bg-[var(--tj-ink)]/15 overflow-hidden"
      >
        <div
          className="h-full bg-[var(--tj-red)]"
          style={{
            width: `${width}%`,
            transition: 'width 1200ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
      <span className="block mt-1 text-[0.6rem] tracking-[0.15em] opacity-60">
        {target}%
      </span>
    </div>
  )
}

const TYPE_ORDER: BagType[] = ['state', 'special', 'standard']
const TYPE_PILL_LABEL: Record<BagType, string> = {
  state: 'States',
  special: 'Specials',
  standard: 'Standard',
}

function FilterBar({
  availableTypes,
  typeFilter,
  onTypeFilter,
  query,
  onQuery,
  sort,
  onSort,
  visibleCount,
  totalCount,
  filtersActive,
}: {
  availableTypes: BagType[]
  typeFilter: TypeFilter
  onTypeFilter: (v: TypeFilter) => void
  query: string
  onQuery: (v: string) => void
  sort: SortOrder
  onSort: (v: SortOrder) => void
  visibleCount: number
  totalCount: number
  filtersActive: boolean
}) {
  return (
    <div className="max-w-[720px] mx-auto mb-10 space-y-4">
      <div
        role="tablist"
        aria-label="Filter by type"
        className="flex flex-wrap items-center justify-center gap-2"
      >
        <TypePill active={typeFilter === 'all'} onClick={() => onTypeFilter('all')}>
          All
        </TypePill>
        {availableTypes.map((t) => (
          <TypePill
            key={t}
            active={typeFilter === t}
            onClick={() => onTypeFilter(t)}
          >
            {TYPE_PILL_LABEL[t]}
          </TypePill>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex-1 min-w-[14rem] max-w-md">
          <span className="sr-only">Search memories</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search memories, places, names…"
            className="w-full border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-3 py-2 font-[var(--tj-body)] text-sm outline-none focus:bg-white"
          />
        </label>
        <label className="flex items-center gap-2 font-[var(--tj-body)] tracking-[0.2em] text-[0.7rem] uppercase font-semibold">
          <span className="opacity-60">Sort</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortOrder)}
            className="border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-2 py-2 font-[var(--tj-body)] tracking-[0.15em] text-[0.7rem] uppercase font-semibold cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      {filtersActive && (
        <p className="text-center font-[var(--tj-body)] italic text-sm opacity-65">
          Showing {visibleCount} of {totalCount}
        </p>
      )}
    </div>
  )
}

function TypePill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`font-[var(--tj-body)] tracking-[0.18em] sm:tracking-[0.22em] text-[0.65rem] sm:text-[0.7rem] uppercase font-semibold px-3 sm:px-3.5 py-1.5 sm:py-2 border-2 border-[var(--tj-ink)] transition-colors ${
        active
          ? 'bg-[var(--tj-ink)] text-[var(--tj-cream)]'
          : 'bg-[var(--tj-cream)] hover:bg-[var(--tj-ink)]/10'
      }`}
    >
      {children}
    </button>
  )
}

function NoMatchesState({ onClear }: { onClear: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-12 border-2 border-dashed border-[var(--tj-ink)]/40 p-10 bg-[var(--tj-kraft)]/15">
      <div className="text-5xl mb-4 select-none" aria-hidden>🔍</div>
      <h3 className="font-[var(--tj-body)] tracking-[0.25em] text-sm uppercase font-bold mb-3">
        Nothing matches
      </h3>
      <p className="italic text-sm mb-6">
        No bags fit those filters yet. <br />
        Try a different type or clear the search.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="inline-block font-[var(--tj-body)] font-semibold tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-5 py-2.5 hover:-translate-y-0.5 transition-transform"
      >
        Clear Filters
      </button>
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

function BagCard({
  bag,
  store,
  encyclopediaEntry,
  index,
}: {
  bag: PantryBag
  store: Store | undefined
  encyclopediaEntry: EncyclopediaBag | undefined
  index: number
}) {
  // Hero photo only — Parker's first upload, or the encyclopedia's front
  // photo as fallback. Full gallery lives on the bag detail page.
  const heroSrc =
    bag.photos[0] ?? (encyclopediaEntry ? defaultReferencePhotos(encyclopediaEntry)[0] : undefined)
  const heroUrl = resolvePhotoUrl(heroSrc)
  const usingFallbackPhotos = bag.photos.length === 0 && Boolean(heroSrc)

  // Alternate tilt by render order — guarantees no two consecutive
  // polaroids share an angle. ±0.5° reads as "barely askew," not chaotic.
  const tilt = index % 2 === 0 ? 0.5 : -0.5

  return (
    <article className="relative py-4">
      {/* Polaroid. White frame, thick bottom caption area, slight tilt. The
          tape strip is a decorative element at the top, also slightly off-
          axis so it reads as hand-applied washi tape. */}
      <div
        className="polaroid relative bg-white border border-[var(--tj-ink)]/25 p-3 md:p-4 pb-4 md:pb-5 shadow-[0_3px_0_rgba(42,31,20,0.10),0_14px_24px_-8px_rgba(42,31,20,0.35)] mx-auto max-w-[420px]"
        style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}
      >
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-[6deg] w-20 h-5 bg-[var(--tj-cream-dark)]/80 border border-[var(--tj-ink)]/15 shadow-[0_1px_0_rgba(42,31,20,0.08)]"
        />

        <Link
          to={`/bags/${bag.slug}`}
          aria-label={`View detail for ${bag.name ?? bag.slug}`}
          className="relative block aspect-square overflow-hidden bg-[var(--tj-kraft)]/30"
        >
          {heroUrl ? (
            <img
              src={heroUrl}
              alt={bag.name ?? bag.slug}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--tj-ink)]/30 text-5xl">
              ✦
            </div>
          )}
        </Link>

        {/* Caption area in the polaroid's white margin — script bag name,
            then a thin line of metadata. Title wraps gracefully on long names
            ("Boston (Massachusetts)") with a slightly tighter line-height and
            balanced wrap distribution so two-line captions still look intentional. */}
        <div className="mt-3 text-center px-1">
          <h3
            lang="en"
            className="text-[var(--tj-red)] text-3xl md:text-4xl leading-[1.05] text-balance break-words hyphens-auto"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            <Link to={`/bags/${bag.slug}`} className="hover:opacity-80 transition-opacity">
              {bag.name ?? 'Untitled Bag'}
            </Link>
          </h3>
          <p className="mt-2 font-[var(--tj-body)] tracking-[0.22em] text-[0.6rem] uppercase opacity-70 flex items-center justify-center gap-[0.5em] flex-wrap">
            <span>{formatShortDate(bag.dateAcquired)}</span>
            <span aria-hidden>·</span>
            <StoreChip storeNumber={bag.storeNumber} store={store} />
          </p>
        </div>
      </div>

      {/* Parker's voice in sticky-note form: warm lined paper, washi tape on
          top, slight rotation so it reads "stuck on the page" rather than
          aligned to the grid. Memory and the encyclopedia link share the
          same note — Parker's perspective is one unit. */}
      {(bag.memory || encyclopediaEntry) && (
        <div className="mt-7 mx-auto max-w-[380px] px-2">
          <div
            className="relative bg-[#FBEFC4] border border-[var(--tj-ink)]/20 px-6 pt-6 pb-4 shadow-[0_2px_0_rgba(42,31,20,0.08),0_12px_22px_-8px_rgba(42,31,20,0.28)]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent 0, transparent calc(1.75rem - 1px), rgba(168, 117, 60, 0.30) calc(1.75rem - 1px), rgba(168, 117, 60, 0.30) 1.75rem)',
              backgroundPositionY: '0.96rem',
              transform: 'rotate(-0.7deg)',
            }}
          >
            {/* Washi tape strip — narrower than the polaroid's, slightly
                rotated, sits like a real piece of tape across the top edge. */}
            <span
              aria-hidden
              className="absolute -top-2 left-1/2 -translate-x-1/2 -rotate-3 w-16 h-4 bg-[var(--tj-kraft)]/75 border border-[var(--tj-ink)]/15 shadow-[0_1px_0_rgba(42,31,20,0.08)]"
            />

            {bag.memory && (
              <blockquote
                className="italic text-base md:text-lg text-[var(--tj-ink)]/85"
                style={{ lineHeight: '1.75rem' }}
              >
                “{bag.memory}”
                <footer
                  className="font-[var(--tj-body)] tracking-[0.25em] text-[0.6rem] uppercase font-semibold opacity-60 not-italic"
                  style={{ lineHeight: '1.75rem' }}
                >
                  — Parker
                </footer>
              </blockquote>
            )}

            {encyclopediaEntry && (
              <div
                className={`${bag.memory ? 'mt-3 pt-2 border-t border-dashed border-[var(--tj-ink)]/25' : ''} text-center`}
              >
                <Link
                  to={`/encyclopedia/${encyclopediaEntry.id}`}
                  className="inline-block font-[var(--tj-body)] tracking-[0.2em] text-[0.65rem] uppercase font-semibold opacity-65 hover:opacity-100 hover:text-[var(--tj-red)] underline-offset-2 hover:underline transition-colors"
                >
                  ↳ More info
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {usingFallbackPhotos && (
        <p className="mt-3 text-center font-[var(--tj-body)] tracking-[0.18em] text-[0.55rem] uppercase opacity-45">
          Reference photos shown — Parker hasn't added her own yet.
        </p>
      )}
    </article>
  )
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function resolvePhotoUrl(path: string | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${BASE}${path.replace(/^\//, '')}`
}

