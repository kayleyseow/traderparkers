import { Link } from 'react-router'
import TopNav from '../TopNav'
import Footer from '../Footer'
import landingStyles from './Landing.module.css'
import { useTitle } from '../useTitle'

export default function NotFound() {
  useTitle('Not Found', 'The page you were looking for is not on the shelf today.', true)
  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] px-6 pt-6 md:pt-8 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <TopNav />

        <div className="max-w-2xl mx-auto">

        <header className="text-center mb-10">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            Aisle 404
          </p>
          <h1
            className="text-[var(--tj-red)] text-6xl md:text-7xl leading-none"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            Out of Stock
          </h1>
          <p className="font-[var(--tj-body)] italic text-base md:text-lg mt-4 max-w-xl mx-auto opacity-75">
            We checked every aisle. This page isn't on the shelf today.
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        {/* Receipt-style "we looked here" list — quietly absurd. */}
        <div className="bg-[var(--tj-kraft)] border-2 border-[var(--tj-ink)] p-6 md:p-8 mb-10 font-mono text-sm shadow-[4px_4px_0_0_var(--tj-ink)]">
          <p className="tracking-[0.3em] text-center text-xs uppercase font-bold mb-4">
            ✱ ✱ ✱  Places We Checked  ✱ ✱ ✱
          </p>
          <ul className="space-y-1.5 italic">
            <li>☐ Behind the seasonal endcap</li>
            <li>☐ Under the produce display</li>
            <li>☐ The break room (twice)</li>
            <li>☐ Last month's Fearless Flyer</li>
            <li>☐ The freezer aisle, near the mochi</li>
            <li>☐ A bowtie crew member's pocket</li>
            <li>☐ That one cart by the curb</li>
          </ul>
          <p className="tracking-[0.3em] text-center text-xs uppercase font-bold mt-5 pt-4 border-t border-dashed border-[var(--tj-ink)]/40">
            Subtotal: still missing
          </p>
        </div>

        <div className="text-center space-y-6">
          <p className="font-serif italic text-base opacity-75">
            But the bazaar is still open. Come on in.
          </p>
          <div className={landingStyles.ctaRow}>
            <Link className={`${landingStyles.cta} ${landingStyles.ctaGhost}`} to="/">
              Hike to Home
            </Link>
            <Link className={`${landingStyles.cta} ${landingStyles.ctaGhost}`} to="/pantry">
              Peer into Parker's Pantry
            </Link>
            <Link className={`${landingStyles.cta} ${landingStyles.ctaGhost}`} to="/encyclopedia">
              Explore the Encyclopedia
            </Link>
            <Link className={`${landingStyles.cta} ${landingStyles.ctaGhost}`} to="/about">
              About the Bazaar
            </Link>
          </div>
        </div>

        </div>
      </div>
      <Footer />
    </main>
  )
}
