import { Link } from 'react-router'
import type { EncyclopediaBag, PinnedBag } from './types'
import { defaultReferencePhotos, inferAngleMap, photoUrl } from './bagPhotos'

/**
 * Small row of Parker-pinned bags rendered on the landing page's visitor
 * view. Returns null when there's nothing pinned so callers can render it
 * unconditionally.
 */
export default function PinnedFavorites({
  pins,
  encyclopediaById,
}: {
  pins: PinnedBag[]
  encyclopediaById: Map<string, EncyclopediaBag>
}) {
  const resolved = pins
    .map((p) => ({ pin: p, bag: encyclopediaById.get(p.encyclopediaId) }))
    .filter((row): row is { pin: PinnedBag; bag: EncyclopediaBag } => !!row.bag)

  if (resolved.length === 0) return null

  return (
    <section className="relative z-10 w-full max-w-3xl mx-auto" aria-label="Parker's pinned bags">
      <h3
        className="text-center text-[var(--tj-red)] text-3xl md:text-4xl mb-4"
        style={{ fontFamily: 'var(--tj-script)' }}
      >
        Parker's Favorites
      </h3>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {resolved.map(({ pin, bag }) => (
          <li key={pin.encyclopediaId}>
            <PinCard bag={bag} note={pin.note} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function PinCard({ bag, note }: { bag: EncyclopediaBag; note?: string }) {
  const photos = defaultReferencePhotos(bag)
  const front = inferAngleMap(photos).front ?? photos[0]
  const displayName = bag.region ?? bag.name

  return (
    <Link
      to={`/encyclopedia/${bag.id}`}
      className="block border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] hover:-translate-y-0.5 hover:shadow-[0_3px_0_rgba(42,31,20,0.25)] transition-transform"
    >
      <div className="aspect-[4/5] overflow-hidden bg-[var(--tj-kraft)]/20 border-b-2 border-[var(--tj-ink)]">
        {front ? (
          <img
            src={photoUrl(front)}
            alt={displayName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center px-2">
            <span
              className="text-[var(--tj-ink)]/40 text-2xl leading-tight"
              style={{ fontFamily: 'var(--tj-script)' }}
            >
              {displayName}
            </span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="font-[var(--tj-body)] text-sm font-bold leading-tight">
          {displayName}
        </p>
        {note && (
          <p className="font-[var(--tj-body)] italic text-xs opacity-70 mt-1 leading-snug">
            “{note}”
          </p>
        )}
      </div>
    </Link>
  )
}
