import { useMemo } from 'react'
import { Link } from 'react-router'
import type { BagType, PantryBag, EncyclopediaBag } from '../../types'
import { US_LOCALES } from '../../usLocales'
import { MATERIAL_LABEL } from '../../materials'
import SectionHeader from './SectionHeader'
import AlphabetScrubber, { type ScrubberItem } from './AlphabetScrubber'
import {
  NON_LOCATION_SECTIONS,
  SPECIAL_MATERIAL_GROUPS,
  SPECIAL_OTHER_GROUP,
  STATES_SECTION,
  SUGGEST_SECTION,
} from './sections'

const BASE = import.meta.env.BASE_URL

type DictMargin = {
  file: string
  caption: string
  side: 'left' | 'right'
  /** Tailwind margin-top class to nudge a single entry away from neighboring marginalia
      (e.g. `mt-24` to clear the lady-liberty caption on the left side). */
  marginTop?: string
}
const DICTIONARY_MARGINS: Record<string, DictMargin> = {
  // ── States ──
  az: { file: 'spots/scenes/whimsical-airship.svg', caption: 'Bag voyage.', side: 'right' },
  'ca-norcal': { file: 'spots/animals/hermit-crab.svg', caption: 'Bag claws.', side: 'left', marginTop: 'mt-40' },
  fl: { file: 'spots/animals/dolphin.svg', caption: 'Make a splash, bag.', side: 'right' },
  ga: { file: 'spots/botanical/peach-branch-color.svg', caption: 'Just peachy.', side: 'left' },
  'ga-atlanta': { file: 'spots/scenes/sailing-boat-color.svg', caption: 'Admit one bag.', side: 'right' },
  la: { file: 'spots/botanical/pink-magnolias.svg', caption: 'Bagnolia State.', side: 'left' },
  md: { file: 'spots/animals/heron-color.svg', caption: 'Wading for a bag.', side: 'right' },
  nh: { file: 'spots/animals/squirrel-color.svg', caption: 'Squirreling away bags.', side: 'left' },
  nm: { file: 'spots/scenes/hot-air-balloon.svg', caption: "Bag's-eye view.", side: 'right' },
  tn: { file: 'spots/botanical/white-magnolias.svg', caption: 'Magnoli-bag.', side: 'right' },
  // ── Insulated / Standard ──
  'vintage-hibiscus': { file: 'spots/botanical/pineapple-color.svg', caption: 'Aloha, bag.', side: 'left' },
  'vintage-lady': { file: 'spots/botanical/cherries-color.svg', caption: 'Cherry on top.', side: 'right' },
  'vintage-produce': { file: 'spots/people/girl-with-chrysanthemums.svg', caption: 'A bouquet of bags.', side: 'right' },
  'victorian-kitchen': { file: 'spots/people/little-girl-petticoat-fan-color.svg', caption: 'Ye olde bag.', side: 'left' },
  // ── Special / Jute ──
  'citrus-jute': { file: 'spots/botanical/lemon-branch-color.svg', caption: 'When life hands you a bag.', side: 'right' },
  // ── Special / Polypropylene ──
  '50th-anniversary': { file: 'spots/people/lady-with-bird-color.svg', caption: 'Aged like fine canvas.', side: 'left' },
  'flower-shop': { file: 'spots/botanical/peonies-color.svg', caption: 'Canvas in full bloom.', side: 'right' },
  'home-cooking-with-joe': { file: 'spots/people/letter-lady-color.svg', caption: 'Bag home some Joe.', side: 'left' },
  moon: { file: 'spots/people/garden-fairy-color.svg', caption: 'A bag of moondust.', side: 'right' },
  'perky-and-uni-corny': { file: 'spots/animals/unicorn-color.svg', caption: 'One bag in a million.', side: 'right' },
  'recycled-ocean-plastic': { file: 'spots/animals/two-ducks-color.svg', caption: 'Sea-worthy bag.', side: 'left' },
  ship: { file: 'spots/scenes/mermaid-and-ship.svg', caption: 'Bag ahoy!', side: 'right' },
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

export default function DictionaryView({
  bags,
  ownedByEncyclopediaId,
}: {
  bags: EncyclopediaBag[]
  ownedByEncyclopediaId: Map<string, PantryBag>
}) {
  /* Group state bags by state code, then by first letter of state name. */
  const stateBagsByCode = useMemo(() => {
    const map = new Map<string, EncyclopediaBag[]>()
    for (const bag of bags) {
      if (bag.type !== 'state' || !bag.stateCode) continue
      const list = map.get(bag.stateCode) ?? []
      list.push(bag)
      map.set(bag.stateCode, list)
    }
    return map
  }, [bags])

  const localesByLetter = useMemo(() => {
    const map = new Map<string, typeof US_LOCALES>()
    for (const locale of US_LOCALES) {
      if (!stateBagsByCode.has(locale.code)) continue
      const letter = locale.name.charAt(0).toUpperCase()
      const list = map.get(letter) ?? []
      list.push(locale)
      map.set(letter, list)
    }
    return map
  }, [stateBagsByCode])

  const bagsByType = useMemo(() => {
    const map = new Map<BagType, EncyclopediaBag[]>()
    for (const bag of bags) {
      if (bag.type === 'state') continue
      const list = map.get(bag.type) ?? []
      list.push(bag)
      map.set(bag.type, list)
    }
    // sort each non-state group alphabetically by name for predictable order
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return map
  }, [bags])

  const specialGroups = useMemo(() => {
    const specials = bagsByType.get('special') ?? []
    const buckets = SPECIAL_MATERIAL_GROUPS.map((g) => ({
      group: g,
      bags: specials.filter((b) => b.materials?.[0] === g.material),
    })).filter((b) => b.bags.length > 0)
    const matchedIds = new Set(buckets.flatMap((b) => b.bags.map((x) => x.id)))
    const leftover = specials.filter((b) => !matchedIds.has(b.id))
    return { buckets, leftover }
  }, [bagsByType])

  const stateBagsCount = useMemo(
    () => bags.filter((b) => b.type === 'state').length,
    [bags],
  )

  /* Build the linear list of scrubber stops in document order. */
  const scrubberItems = useMemo<ScrubberItem[]>(() => {
    const items: ScrubberItem[] = []
    if (localesByLetter.size > 0) {
      items.push({
        id: STATES_SECTION.id,
        label: STATES_SECTION.scrubberLabel ?? STATES_SECTION.label,
        kind: 'section',
      })
      for (const letter of localesByLetter.keys()) {
        items.push({ id: `letter-${letter.toLowerCase()}`, label: letter, kind: 'letter' })
      }
    }
    for (const { type, id, label, scrubberLabel } of NON_LOCATION_SECTIONS) {
      if (!bagsByType.get(type)?.length) continue
      items.push({ id, label: scrubberLabel ?? label, kind: 'section' })
      if (type === 'special') {
        for (const { group } of specialGroups.buckets) {
          items.push({ id: group.id, label: group.scrubberLabel, kind: 'letter' })
        }
        if (specialGroups.leftover.length > 0) {
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
  }, [localesByLetter, bagsByType, specialGroups])

  return (
    <div className="relative">
      <AlphabetScrubber items={scrubberItems} />

      <div className="md:pr-20">
        {/* ── States ── */}
        {localesByLetter.size > 0 && (
          <section>
            <SectionHeader
              id={STATES_SECTION.id}
              label={STATES_SECTION.label}
              count={stateBagsCount}
              blurb={STATES_SECTION.blurb}
              ornament={sectionOrnament(STATES_SECTION.ornamentFile, STATES_SECTION.ornamentClass)}
              first
            />
            {[...localesByLetter.entries()].map(([letter, locales], idx) => (
              <div key={letter}>
                <LetterHeading letter={letter} first={idx === 0} />
                {locales.flatMap((locale) =>
                  (stateBagsByCode.get(locale.code) ?? []).map((bag) => (
                    <DictionaryEntry
                      key={bag.id}
                      bag={bag}
                      ownedBag={ownedByEncyclopediaId.get(bag.id)}
                    />
                  )),
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── Non-state sections ── */}
        {NON_LOCATION_SECTIONS.map(({ type, id, label, blurb, ornamentFile, ornamentClass }, idx) => {
          const list = bagsByType.get(type)
          if (!list || list.length === 0) return null
          const isFirst = idx === 0 && localesByLetter.size === 0
          if (type === 'special') {
            return (
              <section key={type}>
                <SectionHeader id={id} label={label} count={list.length} blurb={blurb} first={isFirst} ornament={sectionOrnament(ornamentFile, ornamentClass)} />
                {specialGroups.buckets.map(({ group, bags: groupBags }, gIdx) => (
                  <div key={group.material}>
                    <MaterialSubheading id={group.id} label={group.label} first={gIdx === 0} />
                    {groupBags.map((bag) => (
                      <DictionaryEntry
                        key={bag.id}
                        bag={bag}
                        ownedBag={ownedByEncyclopediaId.get(bag.id)}
                      />
                    ))}
                  </div>
                ))}
                {specialGroups.leftover.length > 0 && (
                  <div>
                    <MaterialSubheading
                      id={SPECIAL_OTHER_GROUP.id}
                      label={SPECIAL_OTHER_GROUP.label}
                      first={specialGroups.buckets.length === 0}
                    />
                    {specialGroups.leftover.map((bag) => (
                      <DictionaryEntry
                        key={bag.id}
                        bag={bag}
                        ownedBag={ownedByEncyclopediaId.get(bag.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          }
          return (
            <section key={type}>
              <SectionHeader id={id} label={label} count={list.length} blurb={blurb} first={isFirst} ornament={sectionOrnament(ornamentFile, ornamentClass)} />
              {list.map((bag) => (
                <DictionaryEntry
                  key={bag.id}
                  bag={bag}
                  ownedBag={ownedByEncyclopediaId.get(bag.id)}
                />
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────────── PIECES ──────────────────────── */

function LetterHeading({ letter, first = false }: { letter: string; first?: boolean }) {
  return (
    <h3
      id={`letter-${letter.toLowerCase()}`}
      className={`font-[var(--tj-body)] font-bold tracking-[0.5em] text-2xl ${first ? 'mt-2' : 'mt-8'} mb-2 pb-1 border-b-2 border-[var(--tj-ink)]/30 scroll-mt-24`}
    >
      {letter}
    </h3>
  )
}

function DictionaryMargin({ file, caption, side, marginTop }: DictMargin) {
  const sideClass = side === 'left' ? '-left-44' : '-right-44'
  return (
    <aside
      aria-hidden
      className={`group/margin hidden lg:block absolute ${sideClass} top-1/2 -translate-y-1/2 w-44 select-none ${marginTop ?? ''}`}
    >
      <img
        src={`${BASE}decor/${file}`}
        alt=""
        className="w-full h-auto opacity-80 group-hover/margin:opacity-100 transition-opacity duration-300"
      />
      <div
        className={`mt-2 flex items-center gap-1.5 ${
          side === 'left' ? 'justify-start' : 'justify-end flex-row-reverse'
        } opacity-0 group-hover/margin:opacity-100 transition-opacity duration-500`}
      >
        <span className="h-px w-0 group-hover/margin:w-4 bg-[var(--tj-ink)]/60 shrink-0 transition-[width] duration-500" />
        <span className="font-[var(--tj-body)] italic tracking-[0.06em] text-xs whitespace-nowrap opacity-80">
          {caption}
        </span>
      </div>
    </aside>
  )
}

function MaterialSubheading({ id, label, first = false }: { id: string; label: string; first?: boolean }) {
  return (
    <h3
      id={id}
      className={`font-[var(--tj-body)] font-bold tracking-[0.35em] text-base ${first ? 'mt-2' : 'mt-8'} mb-2 pb-1 border-b border-[var(--tj-ink)]/30 uppercase scroll-mt-24`}
    >
      {label}
    </h3>
  )
}

function DictionaryEntry({
  bag,
  ownedBag,
}: {
  bag: EncyclopediaBag
  ownedBag: PantryBag | undefined
}) {
  const design = bag.design ?? {}
  const displayName = (bag.region ?? bag.name).toUpperCase()
  const eyebrowBits = [bag.stateCode, bag.year ? String(bag.year) : null].filter(Boolean) as string[]
  const margin = DICTIONARY_MARGINS[bag.id]

  return (
    <Link
      to={`/encyclopedia/${bag.id}`}
      id={`bag-${bag.id}`}
      className="group relative block py-3 border-b border-[var(--tj-ink)]/15 hover:bg-[var(--tj-ink)]/[0.04] transition-colors scroll-mt-24"
    >
      {margin && <DictionaryMargin {...margin} />}
      <div className="flex items-baseline gap-4">
        <div className="flex-1 min-w-0 leading-relaxed">
          <span className="font-[var(--tj-body)] font-bold tracking-[0.08em]">
            {displayName}
          </span>
          {design.subtitle && (
            <em className="ml-2 opacity-80">{design.subtitle}</em>
          )}
          {design.blurb && (
            <span className="opacity-75"> — {design.blurb}</span>
          )}
        </div>
        <div className="shrink-0 text-right font-[var(--tj-body)] tracking-[0.22em] text-[0.6rem] uppercase opacity-55 leading-tight">
          {eyebrowBits.map((bit, i) => (
            <div key={i}>{bit}</div>
          ))}
          {bag.materials?.map((m) => (
            <div key={m} className="opacity-80">
              {MATERIAL_LABEL[m]}
            </div>
          ))}
          {ownedBag && (
            <div className="text-[var(--tj-red)] opacity-90 mt-1" aria-label="In Parker's pantry">
              ★ Parker's
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

