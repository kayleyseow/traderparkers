type Props = {
  id?: string
  label: string
  count?: number
  countSingular?: string
  countPlural?: string
  blurb?: string
}

export default function SectionHeader({
  id,
  label,
  count,
  countSingular = 'design',
  countPlural = 'designs',
  blurb,
}: Props) {
  return (
    <>
      <header className="flex items-baseline gap-4 mt-14 mb-2">
        <h2
          id={id}
          className="text-[var(--tj-red)] text-4xl md:text-5xl scroll-mt-24"
          style={{ fontFamily: 'var(--tj-script)' }}
        >
          {label}
        </h2>
        {count !== undefined && (
          <span className="ml-auto font-[var(--tj-body)] italic text-sm opacity-60 shrink-0">
            {count} {count === 1 ? countSingular : countPlural}
          </span>
        )}
      </header>
      {blurb && (
        <p className="font-[var(--tj-body)] italic text-sm md:text-base opacity-70 mb-4">
          {blurb}
        </p>
      )}
    </>
  )
}
