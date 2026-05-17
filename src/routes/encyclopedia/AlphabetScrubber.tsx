import { useEffect, useRef, useState } from 'react'

export type ScrubberItem = {
  id: string
  label: string
  /** 'section' is a major heading; 'letter' is a sub-divider inside a section */
  kind: 'section' | 'letter'
}

export default function AlphabetScrubber({ items }: { items: ScrubberItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const visibleRef = useRef(new Set<string>())

  useEffect(() => {
    visibleRef.current.clear()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleRef.current.add(entry.target.id)
          else visibleRef.current.delete(entry.target.id)
        }
        const next = items.find((it) => visibleRef.current.has(it.id))
        if (next) setActiveId(next.id)
      },
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
      className="hidden md:flex fixed right-3 xl:right-6 2xl:right-10 top-1/2 -translate-y-1/2 z-20 flex-col gap-[2px] py-1.5 px-1 bg-[var(--tj-cream)]/90 backdrop-blur-sm border-2 border-[var(--tj-ink)] max-h-[85vh] overflow-y-auto"
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
                ? 'tracking-[0.18em] text-[0.5rem] px-1 py-0.5 mt-1 first:mt-0 border-y border-[var(--tj-ink)]/30 leading-tight'
                : 'tracking-[0.05em] text-[0.65rem] px-1 py-0.5 leading-none',
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
