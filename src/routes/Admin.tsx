import { useState } from 'react'
import { Link } from 'react-router'
import PasswordGate from './admin/PasswordGate'
import BagForm from './admin/BagForm'

export default function Admin() {
  // Password is held in memory only — never in sessionStorage / localStorage.
  // Re-prompt on every fresh page load. The Worker requires it on each save.
  const [password, setPassword] = useState<string | null>(null)

  if (!password) {
    return <PasswordGate onUnlock={setPassword} />
  }

  return (
    <main className="min-h-screen bg-[var(--tj-kraft)] text-[var(--tj-ink)] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <nav className="flex items-center justify-between mb-10">
          <Link
            to="/"
            className="font-sans tracking-[0.25em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-4 py-2 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
          >
            ← The Bazaar
          </Link>
          <button
            type="button"
            onClick={() => setPassword(null)}
            className="font-sans tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
          >
            Lock Up
          </button>
        </nav>

        <header className="text-center mb-10">
          <p className="font-sans tracking-[0.4em] text-xs uppercase border border-[var(--tj-ink)] inline-block px-3 py-1 mb-5 bg-[var(--tj-cream)]">
            Parker's Workshop
          </p>
          <h1 className="font-[TraderJoes,Brush_Script_MT,cursive] text-[var(--tj-red)] text-6xl leading-none">
            Log a New Bag
          </h1>
          <div className="mx-auto mt-5 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        <div className="border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] p-6 md:p-8">
          <BagForm password={password} />
        </div>
      </div>
    </main>
  )
}
