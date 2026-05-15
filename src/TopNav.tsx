import { Link, useLocation } from 'react-router'

type SecondaryItem = { to: string; label: string; matches: (pathname: string) => boolean }

const SECONDARY: SecondaryItem[] = [
  { to: '/encyclopedia',    label: 'Encyclopedia',    matches: (p) => p === '/encyclopedia' || p.startsWith('/encyclopedia/') },
  { to: '/pantry', label: 'Pantry', matches: (p) => p === '/pantry' || p.startsWith('/bags/') },
  { to: '/about',      label: 'About',      matches: (p) => p === '/about' },
]

export default function TopNav({
  backTo,
  backLabel,
}: {
  backTo: string
  backLabel: string
}) {
  const { pathname } = useLocation()
  const visible = SECONDARY.filter((item) => !item.matches(pathname))

  return (
    <nav className="mb-10 flex items-center justify-between flex-wrap gap-3">
      <Link
        to={backTo}
        className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] px-4 py-2 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
      >
        ← {backLabel}
      </Link>
      <div className="flex items-center gap-3 flex-wrap">
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
