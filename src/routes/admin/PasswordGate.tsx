import { useState } from 'react'
import { Link } from 'react-router'
import { checkPassword } from './hashPassword'

export default function PasswordGate({
  onUnlock,
}: {
  onUnlock: (password: string) => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || checking) return
    setChecking(true)
    setError(false)
    const ok = await checkPassword(password)
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
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(false)
              }}
              className={`w-full border-2 bg-[var(--tj-cream)] px-3 py-2.5 font-serif text-base outline-none focus:bg-white transition-colors ${
                error
                  ? 'border-[var(--tj-red)] animate-[shake_0.4s_ease]'
                  : 'border-[var(--tj-ink)]'
              }`}
              placeholder="••••••••••••"
            />
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
          className="block text-[0.7rem] font-[var(--tj-body)] tracking-[0.2em] uppercase opacity-60 hover:opacity-100"
        >
          ← Back to the Bazaar
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
