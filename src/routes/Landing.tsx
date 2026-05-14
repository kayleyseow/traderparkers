import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { CatalogBag, CollectionBag, ProgressStats } from '../types'
import styles from './Landing.module.css'

const BASE = import.meta.env.BASE_URL

export default function Landing() {
  const [stats, setStats] = useState<ProgressStats>({
    totalBags: 0,
    statesCollected: 0,
    totalStates: 0,
    specialsCollected: 0,
    totalSpecials: 0,
  })

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/catalog.json`).then((r) => r.json() as Promise<CatalogBag[]>),
      fetch(`${BASE}data/collection.json`).then((r) => r.json() as Promise<CollectionBag[]>),
    ])
      .then(([catalog, collection]) => {
        const totalStates = new Set(
          catalog
            .filter((b) => b.type === 'state' && b.stateCode)
            .map((b) => b.stateCode as string),
        ).size
        const totalSpecials = catalog.filter((b) => b.type === 'special').length

        const byId = new Map(catalog.map((b) => [b.id, b]))
        const collectedStateCodes = new Set<string>()
        let specialsCollected = 0
        for (const bag of collection) {
          if (!bag.catalogId) continue
          const entry = byId.get(bag.catalogId)
          if (!entry) continue
          if (entry.type === 'state' && entry.stateCode) {
            collectedStateCodes.add(entry.stateCode)
          } else if (entry.type === 'special') {
            specialsCollected++
          }
        }

        setStats({
          totalBags: collection.length,
          statesCollected: collectedStateCodes.size,
          totalStates,
          specialsCollected,
          totalSpecials,
        })
      })
      .catch(() => {
        /* leave defaults — landing is decorative, not a dashboard */
      })
  }, [])

  return (
    <main className={styles.bag}>
      <CrumpleOverlay />
      <div className={styles.border} aria-hidden />

      <div className={styles.topLabel}>Est. 2026 · Parker's Private Stash</div>

      <section className={styles.hero}>
        <h1 className={styles.wordmark}>
          <span className={styles.traderParkers}>Trader Parker's</span>
          <span className={styles.bagBazaar}>Bag Bazaar</span>
        </h1>

        <p className={styles.tagline}>
          A tour of Trader Joe's totes, collected one grocery run at a time.
        </p>
      </section>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{stats.totalBags}</strong>
          <span>BAGS LOGGED</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <strong>
            {stats.statesCollected}/{stats.totalStates || '—'}
          </strong>
          <span>STATES</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <strong>
            {stats.specialsCollected}/{stats.totalSpecials || '—'}
          </strong>
          <span>SPECIAL EDITIONS</span>
        </div>
      </div>

      <div className={styles.ctaRow}>
        <Link className={styles.cta} to="/collection">Enter the Collection</Link>
        <Link className={`${styles.cta} ${styles.ctaGhost}`} to="/catalog">Browse the Catalog</Link>
        <Link className={`${styles.cta} ${styles.ctaGhost}`} to="/admin">Parker Only</Link>
      </div>

      <div className={styles.footer}>
        <span>Type "Trader Joe's Font" by Fontopia (CC BY-NC) · Made with love for Parker · </span>
        <Link to="/about" className={styles.footerLink}>About</Link>
      </div>
    </main>
  )
}

/* ───────────────── CRUMPLED-PAPER BACKGROUND ─────────────────
   Inline SVG noise filter with a slowly-animating seed. The rendered
   noise is multiplied onto the kraft background to produce ridge-and-
   valley shading, like a hand-crumpled grocery bag. */

function CrumpleOverlay() {
  return (
    <svg
      className={styles.crumple}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="paperCrumple" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.013"
            numOctaves="3"
            seed="2"
            result="noise"
          >
            <animate
              attributeName="seed"
              values="2;14;7;20;2"
              keyTimes="0;0.25;0.5;0.75;1"
              dur="45s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="baseFrequency"
              values="0.013;0.016;0.013"
              dur="45s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          {/* Convert noise intensity into a dark, semi-transparent shadow
              so the multiply blend mode etches ridges into the kraft. */}
          <feColorMatrix
            type="matrix"
            values="
              0 0 0 0 0.12
              0 0 0 0 0.07
              0 0 0 0 0.03
              0 0 0 0.38 0"
          />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#paperCrumple)" />
    </svg>
  )
}
