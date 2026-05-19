import { useEffect, useMemo, useRef, useState } from 'react'
import type { Store } from '../../types'
import { US_LOCALES } from '../../usLocales'

const BASE = import.meta.env.BASE_URL
const MAX_VISIBLE = 50

const STATE_NAME_BY_CODE = new Map(US_LOCALES.map((l) => [l.code, l.name]))

type Props = {
  value: Store | null
  onChange: (store: Store | null) => void
}

export default function StoreSelect({ value, onChange }: Props) {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef({ x: 0, y: 0 })

  function trackTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY }
  }
  function wasScroll(e: React.TouchEvent) {
    const t = e.changedTouches[0]
    if (!t) return true
    const dx = Math.abs(t.clientX - touchStartRef.current.x)
    const dy = Math.abs(t.clientY - touchStartRef.current.y)
    return dx > 10 || dy > 10
  }

  useEffect(() => {
    fetch(`${BASE}data/stores.json`, { cache: 'no-cache' })
      .then((r) => r.json() as Promise<Store[]>)
      .then(setStores)
      .catch(() => setStores([]))
  }, [])

  useEffect(() => {
    if (!open) return
    function closeIfOutside(target: Node | null) {
      if (!target) return
      if (!containerRef.current?.contains(target)) {
        setOpen(false)
        setQuery('')
      }
    }
    function onMouseDown(e: MouseEvent) {
      closeIfOutside(e.target as Node)
    }
    // Track touch start position so we can tell a tap from a scroll on
    // touchend. The old version closed on touchstart, which incorrectly
    // fired during scrolls when iOS reflowed the viewport (keyboard
    // dismissal mid-scroll) and synthesized stray taps outside the
    // container.
    let startX = 0
    let startY = 0
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0]
      if (!t) return
      startX = t.clientX
      startY = t.clientY
    }
    function onTouchEnd(e: TouchEvent) {
      const t = e.changedTouches[0]
      if (!t) return
      const dx = Math.abs(t.clientX - startX)
      const dy = Math.abs(t.clientY - startY)
      if (dx > 10 || dy > 10) return // it was a scroll, not a tap
      closeIfOutside(t.target as Node)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!stores) return []
    const q = query.trim().toLowerCase()
    if (!q) return stores.slice(0, MAX_VISIBLE)
    return stores
      .filter((s) => {
        const stateName = STATE_NAME_BY_CODE.get(s.state) ?? ''
        const haystack = `${s.name} ${s.city ?? ''} ${s.state} ${stateName} ${s.storeNumber} ${s.streetAddress ?? ''}`.toLowerCase()
        return haystack.includes(q)
      })
      .slice(0, MAX_VISIBLE)
  }, [stores, query])

  function selectStore(s: Store) {
    onChange(s)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange(null)
            setOpen(true)
          }}
          className="w-full flex items-center justify-between gap-3 border-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 text-left font-serif hover:bg-[var(--tj-cream)] transition-colors"
        >
          <span>
            <strong className="block leading-tight">
              {value.name}, {value.state}
            </strong>
            <span className="text-xs opacity-70">
              Store #{value.storeNumber}
              {value.streetAddress ? ` · ${value.streetAddress}` : ''}
            </span>
          </span>
          <span className="font-[var(--tj-body)] text-[0.65rem] tracking-[0.2em] uppercase opacity-60 shrink-0">
            Change
          </span>
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              if (open) {
                setOpen(false)
                setQuery('')
              } else {
                setOpen(true)
              }
            }}
            disabled={stores === null}
            className="w-full flex items-center justify-between gap-3 border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-3 py-2.5 text-left font-serif hover:bg-white transition-colors disabled:opacity-60"
          >
            <span className="italic opacity-65">
              {stores === null ? 'Loading stores…' : 'Search for a store (optional)'}
            </span>
            <svg
              aria-hidden
              viewBox="0 0 10 6"
              className={`w-2.5 h-1.5 opacity-60 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <path
                d="M1 1l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {open && stores && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] shadow-[0_4px_0_rgba(42,31,20,0.15)]">
              <input
                type="text"
                value={query}
                placeholder="Search by city, state, or store number"
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-b-2 border-[var(--tj-ink)] bg-white px-3 py-2.5 font-serif text-base outline-none"
              />
              <ul
                className="max-h-72 overflow-y-auto"
                onTouchStart={trackTouchStart}
                onTouchMove={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur()
                  }
                }}
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-2.5 italic text-sm opacity-70">
                    No stores match "{query}"
                  </li>
                ) : (
                  filtered.map((s) => (
                    <li key={s.storeNumber}>
                      <button
                        type="button"
                        // On iOS Safari, tapping a non-input element blurs the
                        // focused input *before* the synthesized mousedown fires,
                        // so preventDefault on mousedown is too late — the
                        // keyboard dismisses, the layout reflows, and the
                        // synthesized click lands on the wrong element. Handling
                        // selection on touchend (non-passive in React) and
                        // preventing default there fires the selection *before*
                        // the reflow and suppresses the stray click.
                        onMouseDown={(e) => e.preventDefault()}
                        onTouchEnd={(e) => {
                          if (wasScroll(e)) return
                          e.preventDefault()
                          selectStore(s)
                        }}
                        onClick={() => selectStore(s)}
                        style={{ touchAction: 'manipulation' }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--tj-kraft)] focus:bg-[var(--tj-kraft)] focus:outline-none border-b border-[var(--tj-ink)]/15 last:border-b-0"
                      >
                        <div className="font-serif font-semibold leading-tight">
                          {s.name}, {s.state}
                        </div>
                        <div className="text-xs opacity-65">
                          #{s.storeNumber}
                          {s.streetAddress ? ` · ${s.streetAddress}` : ''}
                        </div>
                      </button>
                    </li>
                  ))
                )}
                {!query && stores.length > MAX_VISIBLE && (
                  <li className="px-3 py-2 text-xs italic opacity-60 border-t border-[var(--tj-ink)]/15">
                    Showing {MAX_VISIBLE} of {stores.length}. Type to narrow.
                  </li>
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
