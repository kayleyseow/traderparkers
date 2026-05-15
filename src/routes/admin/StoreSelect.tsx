import { useEffect, useMemo, useRef, useState } from 'react'
import type { Store } from '../../types'

const BASE = import.meta.env.BASE_URL
const MAX_VISIBLE = 50

type Props = {
  value: Store | null
  onChange: (store: Store | null) => void
}

export default function StoreSelect({ value, onChange }: Props) {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${BASE}data/stores.json`)
      .then((r) => r.json() as Promise<Store[]>)
      .then(setStores)
      .catch(() => setStores([]))
  }, [])

  useEffect(() => {
    if (!open) return
    function close(e: Event) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    // touchstart covers mobile taps outside the dropdown where the synthesized
    // mousedown can be unreliable (especially while the soft keyboard is up).
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!stores) return []
    const q = query.trim().toLowerCase()
    if (!q) return stores.slice(0, MAX_VISIBLE)
    return stores
      .filter((s) => {
        const haystack = `${s.name} ${s.city ?? ''} ${s.state} ${s.storeNumber} ${s.streetAddress ?? ''}`.toLowerCase()
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
          onClick={() => onChange(null)}
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
          <input
            type="text"
            value={query}
            placeholder={stores === null ? 'Loading stores…' : 'Search by city, state, or store number'}
            disabled={stores === null}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            className="w-full border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-3 py-2.5 font-serif text-base outline-none focus:bg-white transition-colors disabled:opacity-60"
          />
          {open && stores && (
            <ul className="absolute z-20 left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] shadow-[0_4px_0_rgba(42,31,20,0.15)]">
              {filtered.length === 0 ? (
                <li className="px-3 py-2.5 italic text-sm opacity-70">
                  No stores match "{query}"
                </li>
              ) : (
                filtered.map((s) => (
                  <li key={s.storeNumber}>
                    <button
                      type="button"
                      // Preventing default on mousedown stops the input from
                      // losing focus on tap. On iOS Safari that focus loss
                      // dismisses the soft keyboard and reflows the layout,
                      // which can swallow the synthesized click — so tapping
                      // a suggestion would do nothing.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectStore(s)}
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
          )}
        </>
      )}
    </div>
  )
}
