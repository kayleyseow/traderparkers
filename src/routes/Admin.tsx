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
    <main className="min-h-screen bg-[var(--tj-kraft)] text-[var(--tj-ink)] px-6 pt-10">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center justify-between mb-10 flex-wrap gap-3">
          <Link
            to="/"
            aria-label="Trader Parker's Bag Bazaar — home"
            className="group flex flex-col items-center transition-transform hover:-translate-y-0.5"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            <span className="text-[var(--tj-red)] text-3xl leading-none group-hover:text-[var(--tj-ink)] transition-colors">
              Trader Parker's
            </span>
            <span className="text-[var(--tj-red)] text-lg leading-none -mt-1 group-hover:text-[var(--tj-ink)] transition-colors">
              Bag Bazaar
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setPassword(null)}
            className="font-[var(--tj-body)] font-semibold tracking-[0.25em] text-[0.7rem] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
          >
            Lock Up
          </button>
        </nav>
      </div>

      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase border border-[var(--tj-ink)] inline-block px-3 py-1 mb-5 bg-[var(--tj-cream)]">
            Parker's Workshop
          </p>

          <section className="mb-8 max-w-xl mx-auto">
            <h2 className="font-[TraderJoes,Brush_Script_MT,cursive] text-[var(--tj-red)] text-6xl leading-none mb-4">
              Admin Panel
            </h2>
            <p className="font-[var(--tj-body)] italic text-sm md:text-base opacity-80 mb-3 text-left">
              Hi Parker! This is your secret lair where you log bags into your pantry,
              file new designs into the encyclopedia, and toggle what's visible on the
              public site.
            </p>
            <p className="font-[var(--tj-body)] italic text-xs md:text-sm opacity-65 text-left">
              Heads up: there's no real backend behind any of this.
              Every save fires off a GitHub Action that commits the data file to the
              repo and rebuilds the whole site, so changes can take a minute or two
              to actually show up. Lowkey this is held up by vibes atp, didn't really system design
              this to actually scale; but it WORKS! In this house we live laugh love. Happy bday!
            </p>
          </section>

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
        <button
          role="tab"
          aria-selected={mode === 'settings'}
          onClick={() => onChange('settings')}
          className={`${baseBtn} ${mode === 'settings' ? active : inactive}`}
        >
          Settings
        </button>
      </div>
    </div>
  )
}
