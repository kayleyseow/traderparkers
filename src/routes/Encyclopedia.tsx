import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { BagType, CategoryVisibility, EncyclopediaBag, PantryBag } from '../types'
import { DEFAULT_VISIBILITY } from '../types'
import { US_LOCALES } from '../usLocales'
import { inferAngleMap, photoUrl } from '../bagPhotos'
import TopNav from '../TopNav'
import Footer from '../Footer'
import SuggestForm from './encyclopedia/SuggestForm'
import DictionaryView from './encyclopedia/DictionaryView'
import SectionHeader from './encyclopedia/SectionHeader'
import {
  NON_LOCATION_SECTIONS,
  STATES_SECTION,
  SUGGEST_SECTION,
} from './encyclopedia/sections'

const BASE = import.meta.env.BASE_URL

type EncyclopediaView = 'gallery' | 'dictionary'
const VIEW_STORAGE_KEY = 'encyclopedia-view'

export default function Encyclopedia() {
  const [rawEncyclopedia, setRawEncyclopedia] = useState<EncyclopediaBag[] | null>(null)
  const [pantry, setPantry] = useState<PantryBag[]>([])
  const [visibility, setVisibility] = useState<CategoryVisibility>(DEFAULT_VISIBILITY)
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
      fetch(`${BASE}data/encyclopedia.json`).then((r) => r.json() as Promise<EncyclopediaBag[]>),
      fetch(`${BASE}data/pantry.json`).then((r) => r.json() as Promise<PantryBag[]>),
    ])
      .then(([cat, col]) => {
        setRawEncyclopedia(cat)
        setPantry(col)
      })
      .catch(() => setRawEncyclopedia([]))
    // Visibility is optional — missing file just means "show everything."
    fetch(`${BASE}data/visibility.json`)
      .then((r) => (r.ok ? (r.json() as Promise<CategoryVisibility>) : null))
      .then((v) => {
        if (v) setVisibility({ ...DEFAULT_VISIBILITY, ...v })
      })
      .catch(() => {
        /* keep defaults */
      })
  }, [])

  // Apply category visibility before any downstream grouping/rendering — one
  // toggle per BagType, mirroring the admin Settings form.
  const encyclopedia = useMemo(() => {
    if (rawEncyclopedia === null) return null
    return rawEncyclopedia.filter((bag) => {
      if (bag.type === 'state') return visibility.state
      if (bag.type === 'special') return visibility.special
      if (bag.type === 'seasonal') return visibility.seasonal
      if (bag.type === 'standard') return visibility.standard
      return true
    })
  }, [rawEncyclopedia, visibility])

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

  const localesWithBags = useMemo(
    () => US_LOCALES.filter((l) => byState.has(l.code)).length,
    [byState],
  )
  const totalKnownBags = encyclopedia?.length ?? 0

  return (
    <main
      id="encyclopedia"
      className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] px-6 pt-6 md:pt-8 overflow-hidden"
    >
      <CrumpleOverlay />

      <div className="relative z-10 max-w-6xl mx-auto">
        <TopNav />

        <header className="text-center mb-10">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            The Bag Encyclopedia
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

        {encyclopedia === null ? (
          <p className="text-center italic opacity-50 py-20">Sorting the encyclopedia…</p>
        ) : (
          <>
            <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-3 mb-6 font-[var(--tj-body)] tracking-[0.25em] text-[0.7rem] uppercase font-semibold">
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

            <ViewToggle view={view} onChange={setView} />

            {view === 'dictionary' ? (
              <DictionaryView
                bags={encyclopedia}
                ownedByEncyclopediaId={ownedByEncyclopediaId}
              />
            ) : (
              <>
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

                {NON_LOCATION_SECTIONS.map((group) => {
                  const bags = byType.get(group.type)
                  if (!bags || bags.length === 0) return null
                  return (
                    <TypeSection
                      key={group.type}
                      id={group.id}
                      label={group.label}
                      blurb={group.blurb}
                      bags={bags}
                      ownedByEncyclopediaId={ownedByEncyclopediaId}
                    />
                  )
                })}
              </>
            )}

            <section>
              <div className="max-w-2xl mx-auto">
                <SectionHeader
                  id={SUGGEST_SECTION.id}
                  label={SUGGEST_SECTION.label}
                  blurb={SUGGEST_SECTION.blurb}
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

function TypeSection({
  id,
  label,
  blurb,
  bags,
  ownedByEncyclopediaId,
}: {
  id: string
  label: string
  blurb: string
  bags: EncyclopediaBag[]
  ownedByEncyclopediaId: Map<string, PantryBag>
}) {
  return (
    <section>
      <SectionHeader id={id} label={label} count={bags.length} blurb={blurb} />
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
  const photos = bag.referencePhotos ?? (bag.referencePhoto ? [bag.referencePhoto] : [])
  const angles = inferAngleMap(photos)
  const front = angles.front ?? photos[0]
  const back = angles.back

  return (
    <Link
      id={`bag-${bag.id}`}
      to={`/encyclopedia/${bag.id}`}
      className="group relative border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] h-full flex flex-col scroll-mt-24 hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(42,31,20,0.2)] transition-transform"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--tj-kraft)]/20 border-b-2 border-[var(--tj-ink)]">
        {front ? (
          <>
            <img
              src={photoUrl(front)}
              alt={bag.region ?? bag.name}
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-contain p-3 transition-opacity duration-300 ${back ? 'group-hover:opacity-0' : ''}`}
            />
            {back && (
              <img
                src={photoUrl(back)}
                alt=""
                aria-hidden
                loading="lazy"
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
