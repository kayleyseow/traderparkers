import { Link } from 'react-router'
import redDotLogo from './assets/icons/orig_red_dot_tp_logo.svg'

/**
 * Site-wide footer used on every interior page (everything except the
 * landing, which has its own bag-tag-style sign-off).
 *
 * Sits inside each page's <main> so the page background extends behind it.
 * Self-contained max-width so it reads consistently regardless of the
 * parent page's content width.
 */
export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="relative z-10 mt-10 border-t border-[var(--tj-ink)]/30"
    >
      <div className="max-w-6xl mx-auto px-6 pt-4 pb-2">
        {/* Top row: logo (center on desktop, top on mobile) flanked by
            wordmark on the left and footer nav on the right. */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/"
            aria-label="Trader Parker's Bag Bazaar"
            className="sm:order-2 shrink-0"
          >
            <img
              src={redDotLogo}
              alt=""
              aria-hidden
              className="h-12 md:h-14 w-auto select-none"
            />
          </Link>
          <Link
            to="/"
            className="sm:order-1 font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-80 hover:opacity-100 underline-offset-4 hover:underline"
          >
            Trader Parker's Bag Bazaar
          </Link>
          <nav
            aria-label="Footer navigation"
            className="sm:order-3 flex items-center gap-x-4 gap-y-1 md:gap-3 flex-wrap justify-center"
          >
            <FooterLink to="/pantry">Pantry</FooterLink>
            <Separator />
            <FooterLink to="/encyclopedia">Encyclopedia</FooterLink>
            <Separator />
            <FooterLink to="/about">About</FooterLink>
          </nav>
        </div>

        {/* Sign-off */}
        <p className="font-[var(--tj-body)] tracking-[0.2em] text-[0.65rem] uppercase font-semibold text-center mt-3 opacity-75 flex items-center justify-center gap-2">
          <span aria-hidden className="text-[var(--tj-red)]">
            ★
          </span>
          Made with love for Parker · Est. 2026
          <span aria-hidden className="text-[var(--tj-red)]">
            ★
          </span>
        </p>
      </div>
    </footer>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      // Tighter tracking/size on phones so all three nav items fit on one
      // line at ~360px without wrapping; restores at md+.
      className="font-[var(--tj-body)] font-semibold tracking-[0.18em] md:tracking-[0.25em] text-[0.65rem] md:text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  )
}

function Separator() {
  // Hidden on phones — the gap-x-4 between links is enough separation, and
  // the stars push the row past the viewport width at narrow widths.
  return (
    <span aria-hidden className="hidden md:inline opacity-30 text-[0.7rem]">
      ★
    </span>
  )
}
