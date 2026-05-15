import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { EncyclopediaBag, PinnedBag } from '../types'
import PinnedFavorites from '../PinnedFavorites'
import styles from './Landing.module.css'

const BASE = import.meta.env.BASE_URL

export default function Landing() {
  const [revealed, setRevealed] = useState(false)
  const [pins, setPins] = useState<PinnedBag[]>([])
  const [encyclopediaById, setEncyclopediaById] = useState<Map<string, EncyclopediaBag>>(new Map())

  useEffect(() => {
    fetch(`${BASE}data/pins.json`)
      .then((r) => r.json() as Promise<PinnedBag[]>)
      .then(setPins)
      .catch(() => {
        /* pins are optional — silently skip if the file is missing */
      })
  }, [])

  useEffect(() => {
    fetch(`${BASE}data/encyclopedia.json`)
      .then((r) => r.json() as Promise<EncyclopediaBag[]>)
      .then((encyclopedia) => {
        setEncyclopediaById(new Map(encyclopedia.map((b) => [b.id, b])))
      })
      .catch(() => {
        /* encyclopedia is only used for pinned-favorites lookups — fine to skip */
      })
  }, [])

  return (
    <main className={styles.bag}>
      <CrumpleOverlay />
      <div className={styles.utensils} aria-hidden>
        <img className={styles.spoon} src={`${BASE}utensils/spoon.svg`} alt="" />
        <img className={styles.fork} src={`${BASE}utensils/fork.svg`} alt="" />
      </div>
      <div className={styles.border} aria-hidden />

      <div className={styles.firstScreen}>
        <div className={styles.topLabel}>Est. 2026 · A Tote Compendium</div>

        <section className={styles.hero}>
          <h1 className={styles.wordmark}>
            <span className={styles.traderParkers}>Trader Parker's</span>
            <span className={styles.bagBazaar}>Bag Bazaar</span>
          </h1>

          <p className={styles.tagline}>
            A tour of Trader Joe's totes, collected one grocery run at a time.
          </p>

          <div className={styles.parkerQuestion}>
            <h2 className={styles.parkerQuestionTitle}>Are you Parker?</h2>
            <div className={styles.yesNoRow}>
              <Link
                className={`${styles.cta} ${styles.ctaParker}`}
                to="/admin"
                aria-label="Yes, I'm Parker — go to the Parker page"
              >
                <span aria-hidden className={styles.parkerStar}>★</span>
                <span className={styles.yesText}>Yes, I'm</span>
                <span className={styles.parkerScript} aria-label="Parker">
                  {'Parker'.split('').map((ch, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="parker-wave"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {ch}
                    </span>
                  ))}
                </span>
                <span aria-hidden className={styles.parkerStar}>★</span>
              </Link>
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className={`${styles.cta} ${styles.ctaGhost}`}
              >
                Just Browsing
              </button>
            </div>
          </div>
        </section>
      </div>

      {revealed && (
        <>
          <p className={styles.visitorTag}>
            Welcome, fellow TP's bag enthusiast!
          </p>

          <PinnedFavorites pins={pins} encyclopediaById={encyclopediaById} />

          <div className={styles.ctaRow}>
            <Link className={`${styles.cta} ${styles.ctaGhost}`} to="/pantry">Peer into Parker's Pantry</Link>
            <Link className={`${styles.cta} ${styles.ctaGhost}`} to="/encyclopedia">Explore the Encyclopedia</Link>
            <Link className={`${styles.cta} ${styles.ctaGhost}`} to="/about">About the Bazaar</Link>
          </div>
        </>
      )}

      <div className={styles.footer}>
        <span>★ Happy Birthday Parker! · Est. 2026 ★</span>
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
            baseFrequency="0.0125"
            numOctaves="3"
            seed="11"
            stitchTiles="stitch"
            result="noise"
          />
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
