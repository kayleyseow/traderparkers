import { Link, useParams } from 'react-router'

export default function BagDetail() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <main className="min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] px-6 py-12 font-serif">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="font-sans tracking-[0.2em] text-xs uppercase underline-offset-4 hover:underline">
          ← The Collection
        </Link>
        <h1 className="font-[TraderJoes,Brush_Script_MT,cursive] text-[var(--tj-red)] text-7xl leading-none mt-6">
          {slug ?? 'Bag'}
        </h1>
        <p className="italic mt-2 opacity-70">
          (Individual bag pages will land here once the data layer is wired up.)
        </p>
      </div>
    </main>
  )
}
