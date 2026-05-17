import { useState } from 'react'
import { Link } from 'react-router'

const WORKER_URL = import.meta.env.VITE_WORKER_URL

export default function PasswordGate({
  onUnlock,
}: {
  onUnlock: (password: string) => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)
  // Browser-built-in reveal eyes are only rendered by Edge / some Chrome on
  // desktop — mobile Safari and Chrome don't show one. Roll our own so the
  // toggle exists everywhere.
  const [revealed, setRevealed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || checking) return
    setChecking(true)
    setError(false)
    const ok = await checkPasswordViaWorker(password)
    if (ok) {
      onUnlock(password)
    } else {
      setError(true)
      setPassword('')
    }
    setChecking(false)
  }

  return (
    <main className="relative min-h-screen bg-[var(--tj-kraft)] text-[var(--tj-ink)] px-6 py-12 flex flex-col items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-md text-center border-2 border-[var(--tj-ink)] bg-[var(--tj-cream)] px-8 py-10 space-y-5">
        <p className="font-[var(--tj-body)] tracking-[0.4em] text-[0.65rem] uppercase border border-[var(--tj-ink)] inline-block px-3 py-1">
          Restricted
        </p>

        <h1 className="font-[TraderJoes,Brush_Script_MT,cursive] text-[var(--tj-red)] text-7xl leading-none">
          Parker Only
        </h1>

        <p className="italic text-sm opacity-80">
          Welcome back — just you in here.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 pt-3" noValidate>
          <label className="block text-left">
            <span className="font-[var(--tj-body)] tracking-[0.2em] text-[0.65rem] uppercase block mb-1.5">
              Password
            </span>
            <div className="relative">
              <input
                type={revealed ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(false)
                }}
                className={`w-full border-2 bg-[var(--tj-cream)] pl-3 pr-12 py-2.5 font-serif text-base outline-none focus:bg-white transition-colors ${
                  error
                    ? 'border-[var(--tj-red)] animate-[shake_0.4s_ease]'
                    : 'border-[var(--tj-ink)]'
                }`}
                placeholder="••••••••••••"
                // Keep autofill/correct behavior reasonable when shown as text.
                autoComplete="current-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                aria-label={revealed ? 'Hide password' : 'Show password'}
                aria-pressed={revealed}
                // Tapping the eye on mobile would otherwise blur the password
                // input, which can dismiss the keyboard mid-typing. Prevent
                // default on mousedown to keep focus where it is.
                onMouseDown={(e) => e.preventDefault()}
                className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[var(--tj-ink)] opacity-60 hover:opacity-100 transition-opacity"
              >
                {revealed ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {error && (
              <span className="block mt-1.5 text-xs italic text-[var(--tj-red)]">
                That doesn't look right. Try again, Parker.
              </span>
            )}
          </label>

          <button
            type="submit"
            disabled={!password || checking}
            className="w-full font-[var(--tj-body)] tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] py-2.5 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? 'Unlocking…' : 'Open the Door'}
          </button>
        </form>

        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 text-[0.7rem] font-[var(--tj-body)] tracking-[0.2em] uppercase opacity-60 hover:opacity-100"
        >
          <span>← Back to the</span>
          <span
            className="text-[var(--tj-red)] text-lg tracking-normal normal-case leading-none"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            Bazaar
          </span>
        </Link>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%  { transform: translateX(-6px); }
          40%  { transform: translateX(6px); }
          60%  { transform: translateX(-4px); }
          80%  { transform: translateX(4px); }
        }
      `}</style>
    </main>
  )
}

async function checkPasswordViaWorker(password: string): Promise<boolean> {
  if (!WORKER_URL) return false
  try {
    const res = await fetch(`${WORKER_URL}/auth/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { ok?: boolean }
    return data.ok === true
  } catch {
    return false
  }
}

function EyeIcon() {
  return (
    <svg
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}
