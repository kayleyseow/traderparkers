/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Deployed Cloudflare Worker URL (e.g. https://parker-bags.example.workers.dev). Optional — admin form falls back to JSON-snippet mode if unset. */
  readonly VITE_WORKER_URL?: string
  /** Cloudflare Turnstile site key for the public suggestion form. Optional — suggestion form is hidden if unset. */
  readonly VITE_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
