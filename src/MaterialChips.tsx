import type { Material } from './types'
import { MATERIAL_LABEL } from './materials'

/**
 * Small row of "tags" describing the materials a bag is made from.
 * Returns null when there's nothing to show, so callers can drop it in
 * unconditionally.
 */
export default function MaterialChips({
  materials,
  className = '',
  size = 'md',
}: {
  materials?: Material[]
  className?: string
  size?: 'sm' | 'md'
}) {
  if (!materials || materials.length === 0) return null
  const text = size === 'sm' ? 'text-[0.55rem]' : 'text-[0.6rem]'
  const pad = size === 'sm' ? 'px-1.5 py-[1px]' : 'px-2 py-0.5'
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {materials.map((m) => (
        <li
          key={m}
          className={`font-[var(--tj-body)] tracking-[0.18em] ${text} uppercase font-semibold border border-[var(--tj-ink)]/40 ${pad}`}
        >
          {MATERIAL_LABEL[m]}
        </li>
      ))}
    </ul>
  )
}
