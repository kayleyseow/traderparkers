import { Link } from 'react-router'
import styles from './Landing.module.css'

export default function Landing() {
  return (
    <main className={styles.bag}>
      <CrumpleOverlay />
      <div className={styles.border} aria-hidden />

      <div className={`${styles.illustration} ${styles.illoTopLeft}`}>
        <div className={styles.illoMotionShip}>
          <Ship />
        </div>
      </div>
      <div className={`${styles.illustration} ${styles.illoTopRight}`}>
        <div className={styles.illoMotionBalloon}>
          <HotAirBalloon />
        </div>
      </div>
      <div className={`${styles.illustration} ${styles.illoBottomLeft}`}>
        <div className={styles.illoMotionPalm}>
          <PalmTree />
        </div>
      </div>
      <div className={`${styles.illustration} ${styles.illoBottomRight}`}>
        <div className={styles.illoMotionCompass}>
          <Compass />
        </div>
      </div>

      <div className={styles.topLabel}>Est. 2026 · Parker's Private Stash</div>

      <section className={styles.hero}>
        <h1 className={styles.wordmark}>
          <span className={styles.traderParkers}>Trader Parker's</span>
          <span className={styles.bagBazaar}>Bag Bazaar</span>
        </h1>

        <CrossedUtensils className={styles.crossedUtensils} />

        <p className={styles.tagline}>
          A tour of Trader Joe's totes, collected one grocery run at a time.
        </p>
      </section>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>0</strong>
          <span>BAGS LOGGED</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <strong>0/50</strong>
          <span>STATES</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <strong>0</strong>
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

/* ────────────────────── ILLUSTRATIONS ──────────────────────
   Simple vintage-style line-art SVGs. */

function CrossedUtensils({ className }: { className?: string }) {
  /** Horizontal crossed fork + spoon, like a banner under the wordmark. */
  return (
    <svg className={className} viewBox="0 0 200 50" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* center crossing point at 100, 25 */}
      {/* spoon: pointing left-down to right-up */}
      <g transform="translate(100 25) rotate(-15)">
        <line x1="-50" y1="0" x2="35" y2="0" strokeWidth="2.5" />
        <ellipse cx="48" cy="0" rx="13" ry="8" fill="currentColor" fillOpacity="0.12" />
        <circle cx="-50" cy="0" r="2" fill="currentColor" stroke="none" />
      </g>
      {/* fork: pointing left-up to right-down */}
      <g transform="translate(100 25) rotate(15)">
        <line x1="-35" y1="0" x2="50" y2="0" strokeWidth="2.5" />
        {/* tines */}
        <line x1="-50" y1="-7" x2="-35" y2="-7" />
        <line x1="-54" y1="-2.5" x2="-35" y2="-2.5" />
        <line x1="-54" y1="2.5" x2="-35" y2="2.5" />
        <line x1="-50" y1="7" x2="-35" y2="7" />
        <line x1="-35" y1="-8" x2="-35" y2="8" />
        <circle cx="50" cy="0" r="2" fill="currentColor" stroke="none" />
      </g>
      {/* center dot where they cross */}
      <circle cx="100" cy="25" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Ship() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 75 Q15 72 25 75 T 45 75 T 65 75 T 85 75 T 95 75" />
      <path d="M5 82 Q15 79 25 82 T 45 82 T 65 82 T 85 82 T 95 82" opacity="0.5" />
      <path d="M20 70 L 80 70 L 73 80 L 27 80 Z" fill="currentColor" fillOpacity="0.1" />
      <line x1="50" y1="70" x2="50" y2="20" />
      <path d="M50 22 L 75 60 L 50 60 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M50 28 L 30 60 L 50 60 Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M50 18 L 58 22 L 50 26 Z" fill="currentColor" />
    </svg>
  )
}

function HotAirBalloon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="50" cy="42" rx="28" ry="32" fill="currentColor" fillOpacity="0.08" />
      <path d="M30 18 Q 50 50 30 70" />
      <path d="M50 12 V 73" />
      <path d="M70 18 Q 50 50 70 70" />
      <line x1="32" y1="70" x2="42" y2="85" />
      <line x1="50" y1="73" x2="50" y2="85" />
      <line x1="68" y1="70" x2="58" y2="85" />
      <rect x="40" y="85" width="20" height="10" fill="currentColor" fillOpacity="0.2" />
      <line x1="40" y1="89" x2="60" y2="89" />
    </svg>
  )
}

function PalmTree() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M48 90 Q 50 60 52 30" />
      <path d="M44 80 L 56 80 M 45 65 L 55 65 M 46 50 L 54 50" opacity="0.5" />
      <path d="M50 30 Q 30 22 18 30 Q 28 25 50 30 Q 70 22 82 30 Q 72 25 50 30" fill="currentColor" fillOpacity="0.1" />
      <path d="M50 30 Q 35 15 22 12 Q 38 18 50 30 Q 62 18 78 12 Q 65 15 50 30" fill="currentColor" fillOpacity="0.1" />
      <path d="M50 30 Q 45 12 35 5 Q 47 15 50 30 Q 53 15 65 5 Q 55 12 50 30" fill="currentColor" fillOpacity="0.1" />
      <circle cx="46" cy="33" r="2.5" fill="currentColor" />
      <circle cx="55" cy="34" r="2.5" fill="currentColor" />
    </svg>
  )
}

function Compass() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="38" />
      <circle cx="50" cy="50" r="32" opacity="0.4" />
      <path d="M50 18 L 56 50 L 50 82 L 44 50 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M18 50 L 50 56 L 82 50 L 50 44 Z" fill="currentColor" fillOpacity="0.15" />
      <text x="50" y="15" fontSize="10" textAnchor="middle" stroke="none" fill="currentColor" fontFamily="serif" fontWeight="700">N</text>
      <circle cx="50" cy="50" r="3" fill="currentColor" />
    </svg>
  )
}
