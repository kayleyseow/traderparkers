import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { BagType, EncyclopediaBag, PantryBag } from '../types'
import { US_LOCALES } from '../usLocales'
import {
  ANGLE_ORDER,
  defaultReferencePhotos,
  inferAngleMap,
  photoUrl,
} from '../bagPhotos'
import TopNav from '../TopNav'
import Footer from '../Footer'
import SuggestForm from './encyclopedia/SuggestForm'
import DictionaryView from './encyclopedia/DictionaryView'
import SectionHeader from './encyclopedia/SectionHeader'
import AlphabetScrubber, { type ScrubberItem } from './encyclopedia/AlphabetScrubber'
import {
  NON_LOCATION_SECTIONS,
  SPECIAL_MATERIAL_GROUPS,
  SPECIAL_OTHER_GROUP,
  STATES_SECTION,
  SUGGEST_SECTION,
} from './encyclopedia/sections'
import { useTitle } from '../useTitle'

const BASE = import.meta.env.BASE_URL

type EncyclopediaView = 'gallery' | 'dictionary'
const VIEW_STORAGE_KEY = 'encyclopedia-view'

export default function Encyclopedia() {
  useTitle({
    title: 'Encyclopedia',
    description:
      "Every known Trader Joe's reusable tote — state-themed, special editions, and the standard lineup, with photos and design notes for each.",
    canonical: 'https://kayleyseow.github.io/tjbags/encyclopedia',
    og: {
      title: "Encyclopedia · Trader Parker's Bag Bazaar",
      description:
        "Every known Trader Joe's reusable tote — state, special, and standard designs.",
      url: 'https://kayleyseow.github.io/tjbags/encyclopedia',
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: "Trader Parker's Bag Bazaar — Encyclopedia",
      description:
        "Every known Trader Joe's reusable tote — state, special, and standard designs.",
      url: 'https://kayleyseow.github.io/tjbags/encyclopedia',
      isPartOf: { '@id': 'https://kayleyseow.github.io/tjbags/#website' },
    },
  })
  const [rawEncyclopedia, setRawEncyclopedia] = useState<EncyclopediaBag[] | null>(null)
  const [pantry, setPantry] = useState<PantryBag[]>([])
  const [view, setView] = useState<EncyclopediaView>(() => {
    if (typeof window === 'undefined') return 'gallery'
    const stored = localStorage.getItem(VIEW_STORAGE_KEY)
    return stored === 'dictionary' ? 'dictionary' : 'gallery'
  })

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view)
  }, [view])

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/encyclopedia.json`, { cache: 'no-cache' }).then((r) => r.json() as Promise<EncyclopediaBag[]>),
      fetch(`${BASE}data/pantry.json`, { cache: 'no-cache' }).then((r) => r.json() as Promise<PantryBag[]>),
    ])
      .then(([cat, col]) => {
        setRawEncyclopedia(cat)
        setPantry(col)
      })
      .catch(() => setRawEncyclopedia([]))
  }, [])

  // Encyclopedia always shows every bag — the visibility toggle in admin
  // Settings only affects the Pantry stats row and the Log-a-Bag picker.
  const encyclopedia = rawEncyclopedia

  const ownedByEncyclopediaId = useMemo(() => {
    const map = new Map<string, PantryBag>()
    for (const bag of pantry) {
      if (bag.encyclopediaId) map.set(bag.encyclopediaId, bag)
    }
    return map
  }, [pantry])

  const byState = useMemo(() => {
    const map = new Map<string, EncyclopediaBag[]>()
    if (!encyclopedia) return map
    for (const bag of encyclopedia) {
      if (bag.type !== 'state' || !bag.stateCode) continue
      const list = map.get(bag.stateCode) ?? []
      list.push(bag)
      map.set(bag.stateCode, list)
    }
    return map
  }, [encyclopedia])

  const byType = useMemo(() => {
    const map = new Map<BagType, EncyclopediaBag[]>()
    if (!encyclopedia) return map
    for (const bag of encyclopedia) {
      if (bag.type === 'state') continue
      const list = map.get(bag.type) ?? []
      list.push(bag)
      map.set(bag.type, list)
    }
    return map
  }, [encyclopedia])

  const statesWithBags = useMemo(
    () => US_LOCALES.filter((l) => l.code !== 'DC' && byState.has(l.code)).length,
    [byState],
  )
  const hasDistrict = byState.has('DC')
  const totalKnownBags = encyclopedia?.length ?? 0

  const galleryScrubberItems = useMemo<ScrubberItem[]>(() => {
    if (!encyclopedia) return []
    const items: ScrubberItem[] = []
    if (byState.size > 0) {
      items.push({
        id: STATES_SECTION.id,
        label: STATES_SECTION.scrubberLabel ?? STATES_SECTION.label,
        kind: 'section',
      })
    }
    for (const sec of NON_LOCATION_SECTIONS) {
      const list = byType.get(sec.type)
      if (!list || list.length === 0) continue
      items.push({
        id: sec.id,
        label: sec.scrubberLabel ?? sec.label,
        kind: 'section',
      })
      if (sec.type === 'special') {
        const matchedIds = new Set<string>()
        for (const g of SPECIAL_MATERIAL_GROUPS) {
          const gb = list.filter((b) => b.materials?.[0] === g.material)
          if (gb.length === 0) continue
          items.push({ id: g.id, label: g.scrubberLabel, kind: 'letter' })
          for (const b of gb) matchedIds.add(b.id)
        }
        const leftover = list.filter((b) => !matchedIds.has(b.id))
        if (leftover.length > 0) {
          items.push({
            id: SPECIAL_OTHER_GROUP.id,
            label: SPECIAL_OTHER_GROUP.scrubberLabel,
            kind: 'letter',
          })
        }
      }
    }
    items.push({
      id: SUGGEST_SECTION.id,
      label: SUGGEST_SECTION.scrubberLabel ?? SUGGEST_SECTION.label,
      kind: 'section',
    })
    return items
  }, [encyclopedia, byState, byType])

  return (
    <main
      id="encyclopedia"
      className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] px-6 pt-6 md:pt-8 overflow-hidden"
    >
      <CrumpleOverlay />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Wide-screen marginalia. Hidden below 2xl; on wider viewports they hang
            off the content column into the empty page margins. */}
        <aside
          aria-hidden
          className="group/liberty hidden 2xl:block absolute -left-[17rem] top-[600px] w-[16rem] select-none"
        >
          <img
            src={`${BASE}decor/spots/people/lady-liberty.svg`}
            alt=""
            className="w-full h-auto opacity-50 group-hover/liberty:opacity-100 transition-opacity duration-300"
          />
          <div className="mt-2 flex items-center gap-1.5 justify-start opacity-0 group-hover/liberty:opacity-100 transition-opacity duration-500">
            <span className="h-px w-0 group-hover/liberty:w-4 bg-[var(--tj-ink)]/60 shrink-0 transition-[width] duration-500" />
            <span className="font-[var(--tj-body)] italic tracking-[0.06em] text-[0.7rem] whitespace-nowrap opacity-80">
              Life, liberty, and the pursuit of bags.
            </span>
          </div>
        </aside>

        {/* Gallery-only marginalia: Victorian-figure spot illustrations
            sprinkled down the page. Each fades up on hover with a caption. */}
        {view === 'gallery' && (
          <>
            {/* Poly subgroup (largest, first inside Special Editions) */}
            <GalleryFigure file="spots/people/lady-with-bird-color.svg" caption="Sweet bag-nothings." side="right" top="top-[5200px]" size="lg" />
            {/* Jute subgroup */}
            <GalleryFigure file="spots/people/girl-with-chrysanthemums.svg" caption="Caught the bag-quet." side="left" top="top-[6800px]" size="xl" />
            {/* Canvas subgroup */}
            <GalleryFigure
              file="spots/people/letter-lady-color.svg"
              side="right"
              top="top-[7500px]"
              caption={
                <span className="block text-right leading-snug">
                  Dearest canvas,
                  <br />
                  You complete me.
                  <br />
                  Sealed with a bag.
                  <br />
                  P.S. See you at checkout.
                </span>
              }
            />
            {/* Standard Bags section */}
            <GalleryFigure file="spots/people/little-girl-petticoat-fan-color.svg" caption="Fan-cy bag." side="left" top="top-[8500px]" />
          </>
        )}

        <TopNav />

        <header className="text-center mb-10">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            The Bag Encyclopedia
          </p>
          <h1
            className="text-[var(--tj-red)] text-6xl md:text-7xl leading-none"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            Every. Single. Bag.
          </h1>
          <p className="font-[var(--tj-body)] italic text-base md:text-lg mt-4 max-w-xl mx-auto opacity-75">
            Trader Joe's regional totes — the ones in the wild, waiting to be found.
            This list is hand-curated, so almost certainly incomplete and probably
            wrong about a few. Spot something off?{' '}
            <a
              href="#enc-suggest"
              className="underline underline-offset-2 hover:text-[var(--tj-red)] transition-colors"
            >
              Tell the Captain.
            </a>
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        {encyclopedia === null ? (
          <p className="text-center italic opacity-50 py-20">Sorting the encyclopedia…</p>
        ) : (
          <>
            <div className="flex items-center justify-center flex-wrap gap-x-4 md:gap-x-6 gap-y-3 mb-6 font-[var(--tj-body)] tracking-[0.25em] text-[0.7rem] uppercase font-semibold">
              <span>
                <StatNumeral>{totalKnownBags}</StatNumeral>
                bags known
              </span>
              <StatStar />
              <span>
                <StatNumeral>{statesWithBags}</StatNumeral>
                states
                {hasDistrict && (
                  <>
                    {' + '}
                    <StatNumeral className="mx-2">1</StatNumeral>
                    district
                  </>
                )}
              </span>
            </div>

            <ViewToggle view={view} onChange={setView} />

            {view === 'dictionary' ? (
              <DictionaryView
                bags={encyclopedia}
                ownedByEncyclopediaId={ownedByEncyclopediaId}
              />
            ) : (
              <div className="relative md:pr-20">
                <AlphabetScrubber items={galleryScrubberItems} />
                {(() => {
                  const stateBags = US_LOCALES.filter((locale) => byState.has(locale.code))
                    .flatMap((locale) => byState.get(locale.code)!)
                  if (stateBags.length === 0) return null
                  return (
                    <section>
                      <SectionHeader
                        id={STATES_SECTION.id}
                        label={STATES_SECTION.label}
                        count={stateBags.length}
                        blurb={STATES_SECTION.blurb}
                        ornament={sectionOrnament(STATES_SECTION.ornamentFile, STATES_SECTION.ornamentClass)}
                        first
                      />
                      <ul className={GALLERY_GRID}>
                        {stateBags.map((bag) => (
                          <li key={bag.id}>
                            <GalleryCard bag={bag} ownedBag={ownedByEncyclopediaId.get(bag.id)} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )
                })()}

                {NON_LOCATION_SECTIONS.map((group, idx) => {
                  const bags = byType.get(group.type)
                  if (!bags || bags.length === 0) return null
                  const isFirst = idx === 0 && byState.size === 0
                  if (group.type === 'special') {
                    return (
                      <SpecialSection
                        key={group.type}
                        id={group.id}
                        label={group.label}
                        blurb={group.blurb}
                        bags={bags}
                        ownedByEncyclopediaId={ownedByEncyclopediaId}
                        first={isFirst}
                        ornament={sectionOrnament(group.ornamentFile, group.ornamentClass)}
                      />
                    )
                  }
                  return (
                    <TypeSection
                      key={group.type}
                      id={group.id}
                      label={group.label}
                      blurb={group.blurb}
                      bags={bags}
                      ownedByEncyclopediaId={ownedByEncyclopediaId}
                      first={isFirst}
                      ornament={sectionOrnament(group.ornamentFile, group.ornamentClass)}
                    />
                  )
                })}
              </div>
            )}

            <figure className="my-16 flex flex-col items-center" aria-hidden>
              <img
                src={`${BASE}decor/${
                  view === 'dictionary' ? 'spots/animals/dog-pack-color.svg' : 'spots/people/courtship-scene-color.svg'
                }`}
                alt=""
                className="w-full max-w-lg opacity-80 select-none"
              />
              <figcaption className="font-[var(--tj-body)] italic text-sm md:text-base mt-3 text-center">
                {view === 'dictionary'
                  ? 'Bag a stray for the pack?'
                  : 'Hand and bag in marriage?'}
              </figcaption>
            </figure>

            <section>
              <div className="max-w-2xl mx-auto">
                <SectionHeader
                  id={SUGGEST_SECTION.id}
                  label={SUGGEST_SECTION.label}
                  blurb={
                    <>
                      Send a missing bag, or anything off about one that's already
                      here. Submissions land as a{' '}
                      <a
                        href="https://github.com/kayleyseow/tjbags/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-[var(--tj-red)] transition-colors"
                      >
                        GitHub issue
                      </a>{' '}
                      the maintainer will review.
                    </>
                  }
                  ornament={sectionOrnament(SUGGEST_SECTION.ornamentFile, SUGGEST_SECTION.ornamentClass)}
                  first
                />
              </div>
              <SuggestForm />
            </section>
          </>
        )}
      </div>
      <Footer />
    </main>
  )
}

const GALLERY_GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'

function GalleryFigure({
  file,
  caption,
  side,
  top,
  size = 'md',
}: {
  file: string
  caption: React.ReactNode
  side: 'left' | 'right'
  top: string
  size?: 'md' | 'lg' | 'xl'
}) {
  const widthClass = size === 'xl' ? 'w-80' : size === 'lg' ? 'w-60' : 'w-44'
  const offsetClass =
    size === 'xl'
      ? side === 'left' ? '-left-80' : '-right-80'
      : size === 'lg'
      ? side === 'left' ? '-left-60' : '-right-60'
      : side === 'left' ? '-left-44' : '-right-44'
  const justifyClass = side === 'left' ? 'justify-start' : 'justify-end flex-row-reverse'
  return (
    <aside
      aria-hidden
      className={`group/figure hidden lg:block absolute ${offsetClass} ${top} ${widthClass} select-none`}
    >
      <img
        src={`${BASE}decor/${file}`}
        alt=""
        className="w-full h-auto opacity-55 group-hover/figure:opacity-100 transition-opacity duration-300"
      />
      <div className={`mt-2 flex items-center gap-1.5 ${justifyClass} opacity-0 group-hover/figure:opacity-100 transition-opacity duration-500`}>
        <span className="h-px w-0 group-hover/figure:w-4 bg-[var(--tj-ink)]/60 shrink-0 transition-[width] duration-500" />
        <span className="font-[var(--tj-body)] italic tracking-[0.06em] text-xs whitespace-nowrap opacity-80">
          {caption}
        </span>
      </div>
    </aside>
  )
}

function sectionOrnament(
  file: string | undefined,
  sizeClass = 'h-14 md:h-16',
): React.ReactNode {
  if (!file) return null
  return (
    <img
      src={`${BASE}decor/${file}`}
      alt=""
      aria-hidden
      className={`${sizeClass} w-auto select-none`}
    />
  )
}

function SpecialSection({
  id,
  label,
  blurb,
  bags,
  ownedByEncyclopediaId,
  first = false,
  ornament,
}: {
  id: string
  label: string
  blurb: string
  bags: EncyclopediaBag[]
  ownedByEncyclopediaId: Map<string, PantryBag>
  first?: boolean
  ornament?: React.ReactNode
}) {
  const grouped = useMemo(() => {
    const buckets = SPECIAL_MATERIAL_GROUPS.map((g) => ({
      group: g,
      bags: bags.filter((b) => b.materials?.[0] === g.material),
    })).filter((b) => b.bags.length > 0)
    const matchedIds = new Set(buckets.flatMap((b) => b.bags.map((x) => x.id)))
    const leftover = bags.filter((b) => !matchedIds.has(b.id))
    return { buckets, leftover }
  }, [bags])

  return (
    <section>
      <SectionHeader id={id} label={label} count={bags.length} blurb={blurb} first={first} ornament={ornament} />
      {grouped.buckets.map(({ group, bags: groupBags }, idx) => (
        <div key={group.material}>
          <MaterialSubheading id={group.id} label={group.label} count={groupBags.length} first={idx === 0} />
          <ul className={GALLERY_GRID}>
            {groupBags.map((bag) => (
              <li key={bag.id}>
                <GalleryCard bag={bag} ownedBag={ownedByEncyclopediaId.get(bag.id)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {grouped.leftover.length > 0 && (
        <div>
          <MaterialSubheading
            id={SPECIAL_OTHER_GROUP.id}
            label={SPECIAL_OTHER_GROUP.label}
            count={grouped.leftover.length}
            first={grouped.buckets.length === 0}
          />
          <ul className={GALLERY_GRID}>
            {grouped.leftover.map((bag) => (
              <li key={bag.id}>
                <GalleryCard bag={bag} ownedBag={ownedByEncyclopediaId.get(bag.id)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function MaterialSubheading({
  id,
  label,
  count,
  first = false,
}: {
  id: string
  label: string
  count: number
  first?: boolean
}) {
  return (
    <h3
      id={id}
      className={`font-[var(--tj-body)] font-bold tracking-[0.3em] text-sm uppercase ${first ? 'mt-2' : 'mt-10'} mb-4 pb-2 border-b border-[var(--tj-ink)]/30 scroll-mt-24`}
    >
      {label}
      <span className="ml-2 font-normal opacity-50">· {count}</span>
    </h3>
  )
}

function TypeSection({
  id,
  label,
  blurb,
  bags,
  ownedByEncyclopediaId,
  first = false,
  ornament,
}: {
  id: string
  label: string
  blurb: string
  bags: EncyclopediaBag[]
  ownedByEncyclopediaId: Map<string, PantryBag>
  first?: boolean
  ornament?: React.ReactNode
}) {
  return (
    <section>
      <SectionHeader id={id} label={label} count={bags.length} blurb={blurb} first={first} ornament={ornament} />
      <ul className={GALLERY_GRID}>
        {bags.map((bag) => (
          <li key={bag.id}>
            <GalleryCard bag={bag} ownedBag={ownedByEncyclopediaId.get(bag.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function StatStar() {
  // Hidden on phones so the stats stack cleanly; mirrors the Footer separator.
  return (
    <span aria-hidden className="hidden md:inline opacity-30 text-base">
      ★
    </span>
  )
}

function StatNumeral({
  children,
  className = 'mr-2',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <strong
      className={`text-2xl tracking-normal text-[var(--tj-red)] align-middle ${className}`}
      style={{ fontFamily: 'var(--tj-script)' }}
    >
      {children}
    </strong>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: EncyclopediaView
  onChange: (v: EncyclopediaView) => void
}) {
  const baseBtn =
    'font-[var(--tj-body)] tracking-[0.25em] text-[0.7rem] uppercase font-semibold px-4 py-2 transition-colors'
  const active = 'bg-[var(--tj-ink)] text-[var(--tj-cream)]'
  const inactive = 'hover:bg-[var(--tj-ink)]/10'
  return (
    <div className="flex items-center justify-center mb-10">
      <div
        role="tablist"
        aria-label="Encyclopedia view"
        className="inline-flex items-stretch border-2 border-[var(--tj-ink)] divide-x-2 divide-[var(--tj-ink)]"
      >
        <button
          role="tab"
          aria-selected={view === 'gallery'}
          onClick={() => onChange('gallery')}
          className={`${baseBtn} ${view === 'gallery' ? active : inactive}`}
        >
          Gallery
        </button>
        <button
          role="tab"
          aria-selected={view === 'dictionary'}
          onClick={() => onChange('dictionary')}
          className={`${baseBtn} ${view === 'dictionary' ? active : inactive}`}
        >
          Dictionary
        </button>
      </div>
    </div>
  )
}

function GalleryCard({
  bag,
  ownedBag,
}: {
  bag: EncyclopediaBag
  ownedBag: PantryBag | undefined
}) {
  const photos = defaultReferencePhotos(bag)
  const angles = inferAngleMap(photos)
  const front = angles.front ?? photos[0]
  const back = angles.back
  const variants = bag.variants ?? []
  const variantCount = variants.length
  const editionCount =
    variantCount === 1 ? variants[0].colorways?.length ?? 0 : variantCount

  const isSpecialPoly =
    bag.type === 'special' && (bag.materials?.includes('polypropylene') ?? false)
  const effectiveZoom = bag.cardZoom ?? (isSpecialPoly ? 1.1 : 1)
  const zoomStyle =
    effectiveZoom !== 1 ? { transform: `scale(${effectiveZoom})` } : undefined

  const photoCycle = useMemo<string[]>(() => {
    if (variantCount === 0) return []
    const hasColorways = variants.some((v) => (v.colorways?.length ?? 0) > 0)
    if (hasColorways) {
      return variants.flatMap((v) => (v.colorways ?? []).map((c) => c.photo))
    }
    if (variantCount < 2) return []
    const cycle: string[] = []
    for (const a of ANGLE_ORDER) {
      for (const v of variants) {
        const m = inferAngleMap(v.referencePhotos ?? [])
        if (m[a]) cycle.push(m[a]!)
      }
    }
    return cycle
  }, [variants, variantCount])
  const isCycling = photoCycle.length > 1
  const [cycleIndex, setCycleIndex] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    },
    [],
  )

  const startCycle = () => {
    if (!isCycling || intervalRef.current !== null) return
    intervalRef.current = window.setInterval(() => {
      setCycleIndex((i) => (i + 1) % photoCycle.length)
    }, 800)
  }

  const stopCycle = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCycleIndex(0)
  }

  return (
    <Link
      id={`bag-${bag.id}`}
      to={`/encyclopedia/${bag.id}`}
      onPointerEnter={startCycle}
      onPointerLeave={stopCycle}
      className="group relative border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] h-full flex flex-col scroll-mt-24 hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(42,31,20,0.2)] transition-transform"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--tj-kraft)]/20 border-b-2 border-[var(--tj-ink)]">
        {editionCount > 1 && (
          <span
            aria-label={`${editionCount} editions`}
            className="absolute top-2 right-2 z-10 font-[var(--tj-body)] tracking-[0.2em] text-[0.55rem] uppercase font-semibold px-1.5 py-0.5 bg-[var(--tj-kraft)] border border-[var(--tj-ink)]/40 text-[var(--tj-ink)]"
          >
            {editionCount} editions
          </span>
        )}
        {front ? (
          isCycling ? (
            photoCycle.map((p, i) => (
              <img
                key={p}
                src={photoUrl(p)}
                alt={i === 0 ? bag.region ?? bag.name : ''}
                aria-hidden={i === 0 ? undefined : true}
                loading="lazy"
                style={zoomStyle}
                className={`absolute inset-0 w-full h-full object-contain p-3 transition-opacity duration-300 ${
                  i === cycleIndex ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))
          ) : (
            <>
              <img
                src={photoUrl(front)}
                alt={bag.region ?? bag.name}
                loading="lazy"
                style={zoomStyle}
                className={`absolute inset-0 w-full h-full object-contain p-3 transition-opacity duration-300 ${back ? 'group-hover:opacity-0' : ''}`}
              />
              {back && (
                <img
                  src={photoUrl(back)}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  style={zoomStyle}
                  className="absolute inset-0 w-full h-full object-contain p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              )}
              {back && (
                <span
                  aria-hidden
                  className="absolute bottom-2 right-2 font-[var(--tj-body)] tracking-[0.2em] text-[0.55rem] uppercase font-semibold px-1.5 py-0.5 bg-[var(--tj-ink)] text-[var(--tj-cream)] opacity-0 group-hover:opacity-90 transition-opacity duration-300"
                >
                  Back
                </span>
              )}
            </>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center px-3">
            <span
              className="text-[var(--tj-ink)]/40 text-3xl leading-tight"
              style={{ fontFamily: 'var(--tj-script)' }}
            >
              {bag.region ?? bag.name}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-[var(--tj-body)] text-base font-bold leading-tight">
          {bag.region ?? bag.name}
        </h3>
        {bag.region && (
          <p className="font-[var(--tj-body)] tracking-[0.18em] text-[0.6rem] uppercase font-semibold opacity-60 mt-0.5">
            {bag.state}
          </p>
        )}
        {ownedBag && (
          <p
            className="font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase font-semibold mt-auto pt-2 text-[var(--tj-red)]/80"
            aria-label="Also in Parker's pantry"
          >
            ★ Parker’s
          </p>
        )}
      </div>
    </Link>
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
        <filter id="paperCrumpleEncyclopedia" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="3"
            seed="11"
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
      <rect width="100%" height="100%" filter="url(#paperCrumpleEncyclopedia)" />
    </svg>
  )
}
