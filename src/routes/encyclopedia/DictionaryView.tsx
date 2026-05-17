import { useMemo } from 'react'
import { Link } from 'react-router'
import type { BagType, PantryBag, EncyclopediaBag } from '../../types'
import { US_LOCALES } from '../../usLocales'
import { DESIGN_NOTES } from '../../bagPhotos'
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
        items.push({ id: `enc-letter-${letter.toLowerCase()}`, label: letter, kind: 'letter' })
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
            />
            {[...localesByLetter.entries()].map(([letter, locales]) => (
              <div key={letter}>
                <LetterHeading letter={letter} />
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
        {NON_LOCATION_SECTIONS.map(({ type, id, label, blurb }) => {
          const list = bagsByType.get(type)
          if (!list || list.length === 0) return null
          if (type === 'special') {
            return (
              <section key={type}>
                <SectionHeader id={id} label={label} count={list.length} blurb={blurb} />
                {specialGroups.buckets.map(({ group, bags: groupBags }) => (
                  <div key={group.material}>
                    <MaterialSubheading id={group.id} label={group.label} />
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
              <SectionHeader id={id} label={label} count={list.length} blurb={blurb} />
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

function LetterHeading({ letter }: { letter: string }) {
  return (
    <h3
      id={`enc-letter-${letter.toLowerCase()}`}
      className="font-[var(--tj-body)] font-bold tracking-[0.5em] text-2xl mt-8 mb-2 pb-1 border-b-2 border-[var(--tj-ink)]/30 scroll-mt-24"
    >
      {letter}
    </h3>
  )
}

function MaterialSubheading({ id, label }: { id: string; label: string }) {
  return (
    <h3
      id={id}
      className="font-[var(--tj-body)] font-bold tracking-[0.35em] text-base mt-8 mb-2 pb-1 border-b border-[var(--tj-ink)]/30 uppercase scroll-mt-24"
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
  const design = DESIGN_NOTES[bag.id] ?? {}
  const displayName = (bag.region ?? bag.name).toUpperCase()
  const eyebrowBits = [bag.stateCode, bag.year ? String(bag.year) : null].filter(Boolean) as string[]

  return (
    <Link
      to={`/encyclopedia/${bag.id}`}
      id={`bag-${bag.id}`}
      className="group block py-3 border-b border-[var(--tj-ink)]/15 hover:bg-[var(--tj-ink)]/[0.04] transition-colors scroll-mt-24"
    >
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
          {!design.blurb && bag.description && (
            <span className="opacity-75"> — {bag.description}</span>
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

