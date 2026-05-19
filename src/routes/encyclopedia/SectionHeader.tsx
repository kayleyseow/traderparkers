type Props = {
  id?: string
  label: string
  count?: number
  countSingular?: string
  countPlural?: string
  blurb?: React.ReactNode
  /** First section in its column — collapses the big mt-14 gap meant for between-section dividers. */
  first?: boolean
  /** Optional decorative SVG/image rendered to the left of the script-font label. */
  ornament?: React.ReactNode
}

export default function SectionHeader({
  id,
  label,
  count,
  countSingular = 'design',
  countPlural = 'designs',
  blurb,
  first = false,
  ornament,
}: Props) {
  return (
    <header className={`group flex items-start gap-5 md:gap-7 ${first ? 'mt-4' : 'mt-14'} mb-4`}>
      {ornament && (
        <div className="shrink-0 self-start -mt-1 md:-mt-2 origin-bottom transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3">
          {ornament}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-4">
          <h2
            id={id}
            className="text-[var(--tj-red)] text-4xl md:text-5xl scroll-mt-24 leading-none"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            {label}
          </h2>
          {count !== undefined && (
            <span className="ml-auto font-[var(--tj-body)] italic text-sm opacity-60 shrink-0">
              {count} {count === 1 ? countSingular : countPlural}
            </span>
          )}
        </div>
        {blurb && (
          <p className="font-[var(--tj-body)] italic text-sm md:text-base opacity-70 mt-2">
            {blurb}
          </p>
        )}
      </div>
    </header>
  )
}
