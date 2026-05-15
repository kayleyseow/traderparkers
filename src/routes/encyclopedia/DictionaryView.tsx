import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { BagType, PantryBag, EncyclopediaBag } from '../../types'
import { US_LOCALES } from '../../usLocales'
import { DESIGN_NOTES } from '../../bagPhotos'
import { MATERIAL_LABEL } from '../../materials'
import SectionHeader from './SectionHeader'
import {
  NON_LOCATION_SECTIONS,
  STATES_SECTION,
  SUGGEST_SECTION,
} from './sections'

/* ────────────────────────────────────────────────────────────────────
   Dictionary view — bags rendered as flowing encyclopedia entries
   (name in bold + italic subtitle + blurb), grouped into sections:
   STATES (with A–Z subdividers), SPECIAL, SEASONAL, STANDARD.

   A sticky right-edge "scrubber" tracks scroll position and lets the
   reader jump between sections / letters, iOS-Contacts-style.
   ──────────────────────────────────────────────────────────────────── */

type ScrubberItem = {
  id: string
  label: string
  /** 'section' is a major heading; 'letter' is an alpha subdivider inside States */
  kind: 'section' | 'letter'
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
      if (bagsByType.get(type)?.length) {
        items.push({ id, label: scrubberLabel ?? label, kind: 'section' })
      }
    }
    items.push({
      id: SUGGEST_SECTION.id,
      label: SUGGEST_SECTION.scrubberLabel ?? SUGGEST_SECTION.label,
      kind: 'section',
    })
    return items
  }, [localesByLetter, bagsByType])

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

/* ──────────────────── ALPHABET SCRUBBER ──────────────────── */

function AlphabetScrubber({ items }: { items: ScrubberItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  /* Holds the latest snapshot of which observed elements are in view so we
     can pick the topmost one consistently across observer firings. */
  const visibleRef = useRef(new Set<string>())

  useEffect(() => {
    visibleRef.current.clear()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleRef.current.add(entry.target.id)
          else visibleRef.current.delete(entry.target.id)
        }
        // Pick the first item (in document order) currently visible.
        const next = items.find((it) => visibleRef.current.has(it.id))
        if (next) setActiveId(next.id)
      },
      // Active band sits in the top ~25% of the viewport so a heading
      // counts as "current" while it's near the top of the page.
      { rootMargin: '0px 0px -75% 0px', threshold: 0 },
    )
    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [items])

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  if (items.length === 0) return null

  return (
    <nav
      aria-label="Encyclopedia section index"
      className="hidden md:flex fixed right-3 top-1/2 -translate-y-1/2 z-20 flex-col gap-[2px] py-2 px-1.5 bg-[var(--tj-cream)]/90 backdrop-blur-sm border-2 border-[var(--tj-ink)] max-h-[85vh] overflow-y-auto"
    >
      {items.map((item) => {
        const isActive = item.id === activeId
        const isSection = item.kind === 'section'
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => jump(item.id)}
            aria-current={isActive ? 'true' : undefined}
            className={[
              'font-[var(--tj-body)] font-semibold uppercase transition-colors',
              isSection
                ? 'tracking-[0.22em] text-[0.55rem] px-1.5 py-1 mt-1 first:mt-0 border-y border-[var(--tj-ink)]/30 leading-tight'
                : 'tracking-[0.08em] text-[0.7rem] px-2 py-0.5 leading-none',
              isActive
                ? 'bg-[var(--tj-ink)] text-[var(--tj-cream)]'
                : 'text-[var(--tj-ink)] hover:bg-[var(--tj-ink)]/10',
            ].join(' ')}
          >
            {isSection ? (
              item.label.split(' ').map((word, i) => (
                <span key={i} className="block">{word}</span>
              ))
            ) : (
              item.label
            )}
          </button>
        )
      })}
    </nav>
  )
}
