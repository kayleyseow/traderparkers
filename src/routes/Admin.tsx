import { useState } from 'react'
import { Link } from 'react-router'
import PasswordGate from './admin/PasswordGate'
import BagForm from './admin/BagForm'
import EntryForm from './admin/EntryForm'
import SettingsForm from './admin/SettingsForm'
import Footer from '../Footer'

type AdminMode = 'log' | 'entry' | 'settings'

const MODE_TITLE: Record<AdminMode, string> = {
  log: 'Log a New Bag',
  entry: 'Add an Encyclopedia Entry',
  settings: 'Settings',
}

export default function Admin() {
  // Password is held in memory only — never in sessionStorage / localStorage.
  // Re-prompt on every fresh page load. The Worker requires it on each save.
  const [password, setPassword] = useState<string | null>(null)
  const [mode, setMode] = useState<AdminMode>('log')

  if (!password) {
    return <PasswordGate onUnlock={setPassword} />
  }

  return (
    <main className="min-h-screen bg-[var(--tj-kraft)] text-[var(--tj-ink)] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <nav className="flex items-center justify-between mb-10">
          <Link
            to="/"
            className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-4 py-2 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
          >
            ← The Bazaar
          </Link>
          <button
            type="button"
            onClick={() => setPassword(null)}
            className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
          >
            Lock Up
          </button>
        </nav>

        <header className="text-center mb-8">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase border border-[var(--tj-ink)] inline-block px-3 py-1 mb-5 bg-[var(--tj-cream)]">
            Parker's Workshop
          </p>
          <h1 className="font-[TraderJoes,Brush_Script_MT,cursive] text-[var(--tj-red)] text-6xl leading-none">
            {MODE_TITLE[mode]}
          </h1>
          <div className="mx-auto mt-5 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        <ModeToggle mode={mode} onChange={setMode} />

        <div className="border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] p-6 md:p-8">
          {mode === 'log' && <BagForm password={password} />}
          {mode === 'entry' && <EntryForm password={password} />}
          {mode === 'settings' && <SettingsForm password={password} />}
        </div>
      </div>
      <Footer />
    </main>
  )
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: AdminMode
  onChange: (m: AdminMode) => void
}) {
  const baseBtn =
    'font-[var(--tj-body)] tracking-[0.25em] text-[0.7rem] uppercase font-semibold px-4 py-2 transition-colors'
  const active = 'bg-[var(--tj-ink)] text-[var(--tj-cream)]'
  const inactive = 'bg-[var(--tj-cream)] hover:bg-[var(--tj-ink)]/10'
  return (
    <div className="flex items-center justify-center mb-6">
      <div
        role="tablist"
        aria-label="Admin task"
        className="inline-flex items-stretch border-2 border-[var(--tj-ink)] divide-x-2 divide-[var(--tj-ink)]"
      >
        <button
          role="tab"
          aria-selected={mode === 'log'}
          onClick={() => onChange('log')}
          className={`${baseBtn} ${mode === 'log' ? active : inactive}`}
        >
          Log a Bag
        </button>
        <button
          role="tab"
          aria-selected={mode === 'entry'}
          onClick={() => onChange('entry')}
          className={`${baseBtn} ${mode === 'entry' ? active : inactive}`}
        >
          Add Encyclopedia Entry
        </button>
      </div>
    </div>
  )
}
