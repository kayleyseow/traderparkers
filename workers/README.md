# Trader Parker's Bag Bazaar — Cloudflare Worker

This is the small backend that powers the admin and suggestion features on the static GH Pages site:

| Endpoint | Who can call it | What it does |
|---|---|---|
| `POST /auth/check` | Parker (login gate) | Verifies the admin password before the form unlocks. |
| `POST /pantry` | Parker (password-gated) | Commits a new bag entry + photos to the `tjbags` GitHub repo. GH Pages then rebuilds and the bag appears. |
| `POST /pantry/edit` | Parker (password-gated) | Updates an existing pantry entry. |
| `POST /pantry/delete` | Parker (password-gated) | Removes a pantry entry and its photos. |
| `POST /settings` | Parker (password-gated) | Persists per-key site settings (e.g. visibility toggles). |
| `POST /suggestions` | Anyone (Turnstile-protected) | Opens a GitHub issue with a proposed encyclopedia entry. You review and decide whether to add it. |

Without this Worker deployed, the site still works — the admin form falls back to "show me JSON to copy-paste manually." Deploying the Worker is what flips the site into "Parker can actually save bags from her phone" mode.

---

## What you need before deploying

1. **A Cloudflare account** — free, no credit card. Sign up at <https://dash.cloudflare.com/sign-up>.
2. **A fine-grained GitHub PAT** — see [§ Step 2](#step-2-make-a-fine-grained-github-pat) below.
3. **A Cloudflare Turnstile widget** — free, see [§ Step 3](#step-3-set-up-cloudflare-turnstile) below.
4. **Node 20+** and `npm`.

---

## Step 1 — Install dependencies and log into Cloudflare

```bash
cd workers
npm install
npx wrangler login          # opens a browser; click "Allow"
```

`wrangler` is Cloudflare's CLI for managing Workers. The login is one-time per machine.

---

## Step 2 — Make a fine-grained GitHub PAT

1. Go to <https://github.com/settings/personal-access-tokens/new>.
2. **Token name:** `parker-bags-worker`
3. **Expiration:** whatever you're comfortable with (90 days is fine; you'll get an email before it expires).
4. **Repository access:** select **Only select repositories** → pick `tjbags`.
5. **Repository permissions:** set these (everything else stays "No access"):
   - **Contents** → **Read and write** *(needed to commit `pantry.json` and photos)*
   - **Issues** → **Read and write** *(needed to create suggestion issues)*
   - **Metadata** → **Read-only** *(GitHub auto-requires this)*
6. Click **Generate token**, then **copy the token string immediately** (it starts with `github_pat_…`). GitHub will not show it again.

If the token leaks: revoke it at <https://github.com/settings/personal-access-tokens>, generate a new one, re-run the secret step below. Worst case someone could spam this single repo with commits — they cannot touch any other repo, your account settings, billing, etc.

---

## Step 3 — Set up Cloudflare Turnstile

Turnstile is Cloudflare's free, invisible bot-detection widget. The public Suggest-a-Bag form needs it to keep spammers from auto-filing junk issues.

1. Go to <https://dash.cloudflare.com/?to=/:account/turnstile>.
2. **Add a site.**
3. **Site name:** `parker-bag-bazaar`
4. **Domain:** add your live site domain (`kayleyseow.github.io`) AND `localhost` for local dev.
5. **Widget mode:** Managed (recommended — Cloudflare picks invisible vs. interactive automatically).
6. After creating, copy two values:
   - **Site key** (starts `0x4AAAA…`) → goes into the **frontend** `.env.local` as `VITE_TURNSTILE_SITE_KEY`
   - **Secret key** (starts `0x4AAAA…`) → goes into the **Worker** as `TURNSTILE_SECRET` (next step)

For purely-local dev without setting up a real widget, Cloudflare provides always-pass test keys:
- Site key: `1x00000000000000000000AA`
- Secret: `1x0000000000000000000000000000000AA`

---

## Step 4 — Set the Worker's three secrets

From inside `workers/`:

```bash
npx wrangler secret put GITHUB_TOKEN
# Paste your fine-grained PAT, press Enter

npx wrangler secret put ADMIN_HASH
# Paste the SHA-256 hex of the admin password.
# (Use the SAME value as PASSWORD_HASH in src/routes/admin/hashPassword.ts.)

npx wrangler secret put TURNSTILE_SECRET
# Paste your Turnstile secret key
```

Each one prompts for the value. They get encrypted by Cloudflare and are never visible in logs, source, or `wrangler.toml`.

---

## Step 5 — Update `wrangler.toml` for your repo

`wrangler.toml` already points at `kayleyseow/tjbags` with the correct paths. If you fork this repo or rename anything, update these:

- `GITHUB_REPO` — `<your-github-username>/tjbags`
- `ALLOWED_ORIGINS` — comma-separated list of origins allowed to call this Worker. Should include your GH Pages URL (e.g. `https://kayleyseow.github.io`) and the local Vite ports (`http://localhost:5173`, etc.).

---

## Step 6 — Deploy

```bash
npx wrangler deploy
```

This bundles `src/index.ts` and uploads it to Cloudflare. You'll get back a URL like:

```
https://parker-bags.<your-cf-subdomain>.workers.dev
```

Copy that URL.

---

## Step 7 — Tell the frontend where the Worker lives

In the project root (NOT inside `workers/`), create `.env.local`:

```bash
VITE_WORKER_URL=https://parker-bags.<your-cf-subdomain>.workers.dev
VITE_TURNSTILE_SITE_KEY=0x4AAAA...                   # site key from Step 3
```

Restart the Vite dev server. The admin form now POSTs to the Worker; the suggestion form on `/encyclopedia` becomes active.

For the production GH Pages build, set those same env vars in your GitHub Actions deploy workflow (whenever you set that up — `.env.local` is for local dev only).

---

## Local development against a deployed Worker

If you just want to point the local Vite frontend at the deployed Worker (easiest), do Step 7 and you're done.

If you want to develop the Worker locally too:

```bash
cd workers
npx wrangler dev
```

That spins up the Worker at `http://localhost:8787` using a local SQLite-backed simulation. Set `VITE_WORKER_URL=http://localhost:8787` in `.env.local`. Note: secrets must be present in `.dev.vars` (a gitignored file) for local dev — see [Wrangler docs](https://developers.cloudflare.com/workers/configuration/secrets/#local-development-with-secrets).

Example `workers/.dev.vars`:
```
GITHUB_TOKEN=github_pat_...
ADMIN_HASH=a4e3c7b0da7f9493bcc9fee87d2f99e3bd895a75f43298d2068ea0775ae22069
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

---

## Rotating secrets

Just re-run `wrangler secret put <NAME>` with the new value. The Worker picks up the new value on the next request — no code change, no redeploy needed.

---

## Cost

Free, for this scale. Cloudflare's Workers free tier is 100,000 requests/day. Parker logging ~5 bags a month uses ~20 requests; suggestions might add a few more. You're 4 orders of magnitude under the limit.

---

## Tearing it down

```bash
npx wrangler delete
```

Removes the Worker. Site falls back to the JSON-snippet manual flow. No data is lost — `pantry.json` lives in your repo.

---

<p align="center">
  <img src="../src/assets/icons/orig_red_dot_tp_logo.png" alt="Parker's Bag Bazaar Worker" width="52" />
</p>
