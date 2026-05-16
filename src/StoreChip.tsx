import { useEffect, useState } from 'react'
import type { Store } from './types'

const BASE = import.meta.env.BASE_URL

// Module-level cache so every chip on a page shares one fetch.
let storesPromise: Promise<Map<string, Store>> | null = null

function loadStores(): Promise<Map<string, Store>> {
  if (!storesPromise) {
    storesPromise = fetch(`${BASE}data/stores.json`)
      .then((r) => r.json() as Promise<Store[]>)
      .then((list) => new Map(list.map((s) => [s.storeNumber, s])))
      .catch(() => new Map<string, Store>())
  }
  return storesPromise
}

type Props = {
  storeNumber: string
  /** Optional pre-resolved store — skips the internal lookup if the caller
   *  already has it (e.g. Pantry + BagDetail, which fetch stores.json anyway). */
  store?: Store
  className?: string
}

export default function StoreChip({ storeNumber, store: pre, className = '' }: Props) {
  const [store, setStore] = useState<Store | null>(pre ?? null)

  useEffect(() => {
    if (store) return
    let cancelled = false
    loadStores().then((map) => {
      if (!cancelled) setStore(map.get(storeNumber) ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [storeNumber, store])

  const label = store
    ? `${store.city ?? store.name} · ${store.state} · #${store.storeNumber}`
    : `Store #${storeNumber}`

  // Em-based sizing means the chip scales with surrounding text — tiny in the
  // polaroid microcaption, body-sized in About-page prose. normal-case +
  // tracking-normal override parent contexts that might be uppercase/tracked.
  const chip =
    'inline-flex items-center gap-[0.35em] align-baseline whitespace-nowrap ' +
    'border border-[var(--tj-ink)]/40 bg-[var(--tj-cream)] px-[0.55em] py-[0.1em] ' +
    'font-[var(--tj-body)] font-normal normal-case tracking-normal leading-tight no-underline ' +
    className

  if (!store?.url) {
    return (
      <span className={chip}>
        <PinIcon />
        <span>{label}</span>
      </span>
    )
  }

  return (
    <a
      href={store.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} on Trader Joe's locator`}
      className={`${chip} hover:bg-[var(--tj-kraft)] transition-colors`}
    >
      <PinIcon />
      <span>{label}</span>
    </a>
  )
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="0.9em"
      height="0.9em"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  )
}
