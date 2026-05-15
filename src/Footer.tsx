import { Link } from 'react-router'

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
      className="relative z-10 mt-20 border-t border-[var(--tj-ink)]/30"
    >
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-10">
        {/* Top row: identity + secondary nav */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <Link
            to="/"
            className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-80 hover:opacity-100 underline-offset-4 hover:underline"
          >
            Trader Parker's Bag Bazaar
          </Link>
          <nav
            aria-label="Footer navigation"
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <FooterLink to="/pantry">Pantry</FooterLink>
            <Separator />
            <FooterLink to="/encyclopedia">Encyclopedia</FooterLink>
            <Separator />
            <FooterLink to="/about">About</FooterLink>
          </nav>
        </div>

        {/* Disclaimer */}
        <p className="font-[var(--tj-body)] italic text-xs opacity-60 text-center max-w-xl mx-auto leading-relaxed">
          A non-commercial fan project. Trader Joe's wordmark and visual
          identity belong to Trader Joe's Company.
        </p>

        {/* Sign-off */}
        <p className="font-[var(--tj-body)] tracking-[0.2em] text-[0.65rem] uppercase font-semibold text-center mt-5 opacity-75 flex items-center justify-center gap-2">
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
      className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  )
}

function Separator() {
  return (
    <span aria-hidden className="opacity-30 text-[0.7rem]">
      ★
    </span>
  )
}
