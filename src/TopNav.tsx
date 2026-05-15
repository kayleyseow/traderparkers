import { Link, useLocation } from 'react-router'

type SecondaryItem = { to: string; label: string; matches: (pathname: string) => boolean }

const SECONDARY: SecondaryItem[] = [
  { to: '/encyclopedia',    label: 'Encyclopedia',    matches: (p) => p === '/encyclopedia' || p.startsWith('/encyclopedia/') },
  { to: '/pantry', label: 'Pantry', matches: (p) => p === '/pantry' || p.startsWith('/bags/') },
  { to: '/about',      label: 'About',      matches: (p) => p === '/about' },
]

export default function TopNav() {
  const { pathname } = useLocation()
  const visible = SECONDARY.filter((item) => !item.matches(pathname))

  return (
    // Phones: stack wordmark on top, nav cluster centered underneath. md+
    // restores the original "wordmark left, nav right" layout. This swaps an
    // awkward 3-line wrap on narrow screens for a 2-row intentional banner.
    <nav className="mb-10 flex flex-col items-center gap-4 md:flex-row md:justify-between md:gap-3">
      <Link
        to="/"
        aria-label="Trader Parker's Bag Bazaar — home"
        className="group flex flex-col items-center transition-transform hover:-translate-y-0.5"
        style={{ fontFamily: 'var(--tj-script)' }}
      >
        <span className="text-[var(--tj-red)] text-2xl md:text-3xl leading-none group-hover:text-[var(--tj-ink)] transition-colors">
          Trader Parker's
        </span>
        <span className="text-[var(--tj-red)] text-base md:text-lg leading-none -mt-1 group-hover:text-[var(--tj-ink)] transition-colors">
          Bag Bazaar
        </span>
      </Link>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {visible.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
          >
            {item.label}
          </Link>
        ))}
        <Link
          to="/admin"
          aria-label="Parker only — log a new bag"
          className="parker-only-btn group inline-flex items-center gap-1.5 px-3 py-1.5"
        >
          <span
            aria-hidden
            className="text-[var(--tj-red)] text-sm leading-none group-hover:text-[var(--tj-cream)] transition-colors"
          >
            ★
          </span>
          <span
            className="text-[var(--tj-red)] text-2xl leading-none group-hover:text-[var(--tj-cream)] transition-colors"
            style={{ fontFamily: 'var(--tj-script)' }}
            aria-label="Parker"
          >
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
          <span
            className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase text-[var(--tj-ink)] group-hover:text-[var(--tj-cream)] transition-colors"
            aria-label="Only"
          >
            {'Only'.split('').map((ch, i) => (
              <span
                key={i}
                aria-hidden
                className="parker-wave"
                style={{ animationDelay: `${(i + 6) * 0.05}s` }}
              >
                {ch}
              </span>
            ))}
          </span>
          <span
            aria-hidden
            className="text-[var(--tj-red)] text-sm leading-none group-hover:text-[var(--tj-cream)] transition-colors"
          >
            ★
          </span>
        </Link>
      </div>
    </nav>
  )
}
