/**
 * Parker's Bag Bazaar — Cloudflare Worker
 *
 * Endpoints:
 *   POST /auth/check     — verifies the admin password against ADMIN_HASH; returns { ok }
 *   POST /pantry         — password-gated; commits a new bag + photos to the repo
 *   POST /pantry/edit    — password-gated; updates an existing pantry entry
 *   POST /pantry/delete  — password-gated; removes a pantry entry + its photos
 *   POST /settings       — password-gated; persists per-key JSON settings
 *   POST /suggestions    — public (Turnstile-protected); opens a GitHub issue
 *
 * Setup: see workers/README.md
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Env = {
  // Vars (wrangler.toml)
  GITHUB_REPO: string
  GITHUB_BRANCH: string
  PANTRY_PATH: string
  PHOTOS_PATH_PREFIX: string
  ALLOWED_ORIGINS: string
  // Secrets (wrangler secret put)
  GITHUB_TOKEN: string
  ADMIN_HASH: string
  TURNSTILE_SECRET: string
  // Rate limiter (wrangler.toml [[unsafe.bindings]])
  AUTH_LIMITER: { limit: (opts: { key: string }) => Promise<{ success: boolean }> }
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', async (c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  return cors({
    origin: (origin) => (origin && allowed.includes(origin) ? origin : null),
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })(c, next)
})

// Rate-limit write endpoints by client IP. Defense against brute-force on the
// admin password — 10/min/IP makes a wordlist attack infeasible even before
// ADMIN_HASH is rotated to something strong. Suggestions also rate-limited as
// belts-and-suspenders next to Turnstile. Preflight OPTIONS skipped because
// the browser caches them and they're not an attack surface.
const RATE_LIMITED_PATHS = new Set([
  '/auth/check',
  '/pantry',
  '/pantry/edit',
  '/pantry/delete',
  '/settings',
  '/suggestions',
])
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next()
  if (!RATE_LIMITED_PATHS.has(c.req.path)) return next()
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const { success } = await c.env.AUTH_LIMITER.limit({ key: ip })
  if (!success) {
    return c.json({ error: 'Too many requests. Try again in a minute.' }, 429)
  }
  return next()
})

app.get('/', (c) =>
  c.json({
    name: 'parker-bags',
    endpoints: [
      'POST /auth/check',
      'POST /pantry',
      'POST /pantry/edit',
      'POST /pantry/delete',
      'POST /settings',
      'POST /suggestions',
    ],
  }),
)

/* ──────────────────────────  /auth/check  ──────────────────────────
   Front-end login gate. Verifies the password against ADMIN_HASH without
   exposing the hash to anyone reading the JS bundle. Brute force is throttled
   by the same RATE_LIMITED_PATHS middleware as the write endpoints. The
   password is still required on every write endpoint — this just powers the
   admin UI's "unlock" affordance. */

app.post('/auth/check', async (c) => {
  let body: { password?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  const { password } = body
  if (!password) {
    return c.json({ ok: false, error: 'Missing password' }, 400)
  }

  const incomingHash = await sha256Hex(password)
  const ok = constantTimeEqual(incomingHash, c.env.ADMIN_HASH)
  return c.json({ ok })
})

/* ──────────────────────────  /pantry  ────────────────────────── */

type IncomingBag = {
  slug: string
  name: string
  encyclopediaId?: string
  storeNumber: string
  dateAcquired: string
  memory: string
}

type IncomingPhoto = {
  name: string
  base64: string
}

app.post('/pantry', async (c) => {
  let body: { password?: string; bag?: IncomingBag; photos?: IncomingPhoto[] }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const { password, bag, photos = [] } = body
  if (!password || !bag) {
    return c.json({ error: 'Missing password or bag' }, 400)
  }

  // 1. Verify the admin password.
  const incomingHash = await sha256Hex(password)
  if (!constantTimeEqual(incomingHash, c.env.ADMIN_HASH)) {
    return c.json({ error: 'Wrong password' }, 401)
  }

  // 2. Validate bag shape.
  const fieldError = validateBag(bag)
  if (fieldError) return c.json({ error: fieldError }, 400)
  if (photos.length > 5) {
    return c.json({ error: 'Too many photos (max 5)' }, 400)
  }

  // 3. Read pantry.json so we can reject duplicate slugs and append the new
  //    entry. The whole submission is committed atomically below, so there's
  //    no orphan-photo risk if anything later fails.
  let existing: { content: string; sha: string }
  try {
    existing = await ghReadFile(c.env, c.env.PANTRY_PATH)
  } catch (err) {
    return c.json({ error: `Failed to read pantry: ${(err as Error).message}` }, 502)
  }

  let pantry: { slug?: string }[]
  try {
    const parsed = JSON.parse(existing.content)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    pantry = parsed
  } catch {
    return c.json({ error: 'pantry.json is not valid JSON array' }, 502)
  }

  if (pantry.some((b) => b.slug === bag.slug)) {
    return c.json(
      {
        error: `A bag with slug "${bag.slug}" is already logged. Pick a different date or encyclopedia entry.`,
        code: 'duplicate_slug',
      },
      409,
    )
  }

  // 4. Stage every file in memory before touching GitHub: photos at random
  //    suffixes + the updated pantry.json. Then commit them all in one shot.
  const photoPaths: string[] = []
  const files: { path: string; contentBase64: string }[] = []
  for (const photo of photos) {
    const ext = sanitizeExtension(photo.name)
    const path = `${c.env.PHOTOS_PATH_PREFIX}/${bag.slug}-${randomId(6)}${ext}`
    files.push({ path, contentBase64: photo.base64 })
    // Public URL path (pantry.json stores leading-slash absolute paths under public/).
    photoPaths.push('/' + path.replace(/^public\//, ''))
  }

  const newEntry = {
    slug: bag.slug,
    encyclopediaId: bag.encyclopediaId,
    name: bag.name,
    storeNumber: bag.storeNumber,
    dateAcquired: bag.dateAcquired,
    memory: bag.memory,
    photos: photoPaths,
  }
  pantry.push(newEntry)

  const newContent = JSON.stringify(pantry, null, 2) + '\n'
  files.push({ path: c.env.PANTRY_PATH, contentBase64: utf8ToBase64(newContent) })

  try {
    const result = await ghCommitMany(
      c.env,
      { writes: files },
      `Add bag: ${bag.name}`,
    )
    return c.json({
      ok: true,
      slug: bag.slug,
      photoPaths,
      commitUrl: result.commitUrl,
    })
  } catch (err) {
    return c.json({ error: `Failed to commit: ${(err as Error).message}` }, 502)
  }
})

/* ──────────────────────────  /pantry/edit  ──────────────────────────
   Updates an existing pantry entry. The client sends:
     - originalSlug: which entry to edit (lookup key)
     - bag: the full new bag data (slug, name, encyclopediaId, storeNumber,
       dateAcquired, memory). The slug may differ from originalSlug.
     - photoPlan: ordered array describing the final photos. Each item is
       either { kind: 'existing', path } (keep an existing photo URL) or
       { kind: 'new', name, base64 } (upload a new photo).
   The worker computes which old photos got dropped, uploads new ones,
   rewrites the entry in pantry.json (at its original index, so list order
   stays stable), and commits everything atomically. Photo files that are
   no longer referenced AND live under PHOTOS_PATH_PREFIX get deleted from
   the repo. Curated reference photos (anything outside the prefix) are
   left alone — they may be shared by encyclopedia entries. */

type PhotoPlanItem =
  | { kind: 'existing'; path: string }
  | { kind: 'new'; name: string; base64: string }

app.post('/pantry/edit', async (c) => {
  let body: {
    password?: string
    originalSlug?: string
    bag?: IncomingBag
    photoPlan?: PhotoPlanItem[]
  }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const { password, originalSlug, bag, photoPlan = [] } = body
  if (!password || !originalSlug || !bag) {
    return c.json({ error: 'Missing password, originalSlug, or bag' }, 400)
  }

  const incomingHash = await sha256Hex(password)
  if (!constantTimeEqual(incomingHash, c.env.ADMIN_HASH)) {
    return c.json({ error: 'Wrong password' }, 401)
  }

  const fieldError = validateBag(bag)
  if (fieldError) return c.json({ error: fieldError }, 400)
  if (photoPlan.length > 5) {
    return c.json({ error: 'Too many photos (max 5)' }, 400)
  }

  let existing: { content: string; sha: string }
  try {
    existing = await ghReadFile(c.env, c.env.PANTRY_PATH)
  } catch (err) {
    return c.json({ error: `Failed to read pantry: ${(err as Error).message}` }, 502)
  }

  type PantryEntry = {
    slug: string
    encyclopediaId?: string
    name?: string
    storeNumber: string
    dateAcquired: string
    memory: string
    photos: string[]
    parkerPhoto?: string
  }
  let pantry: PantryEntry[]
  try {
    const parsed = JSON.parse(existing.content)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    pantry = parsed
  } catch {
    return c.json({ error: 'pantry.json is not valid JSON array' }, 502)
  }

  const idx = pantry.findIndex((b) => b.slug === originalSlug)
  if (idx === -1) {
    return c.json({ error: `No entry with slug "${originalSlug}"`, code: 'not_found' }, 404)
  }

  // If the slug changed, make sure the new one doesn't collide with another entry.
  if (bag.slug !== originalSlug && pantry.some((b, i) => i !== idx && b.slug === bag.slug)) {
    return c.json(
      {
        error: `A bag with slug "${bag.slug}" already exists. Pick a different date or encyclopedia entry.`,
        code: 'duplicate_slug',
      },
      409,
    )
  }

  const original = pantry[idx]
  const photoPrefixUrl = '/' + c.env.PHOTOS_PATH_PREFIX.replace(/^public\//, '') + '/'

  // Stage new photo uploads — give them filenames prefixed with the new slug.
  const writes: { path: string; contentBase64: string }[] = []
  const finalPhotos: string[] = []
  for (const item of photoPlan) {
    if (item.kind === 'existing') {
      finalPhotos.push(item.path)
    } else {
      const ext = sanitizeExtension(item.name)
      const path = `${c.env.PHOTOS_PATH_PREFIX}/${bag.slug}-${randomId(6)}${ext}`
      writes.push({ path, contentBase64: item.base64 })
      finalPhotos.push('/' + path.replace(/^public\//, ''))
    }
  }

  // Compute photos to delete: anything in the original that isn't kept AND
  // lives under PHOTOS_PATH_PREFIX (don't touch encyclopedia reference
  // photos under `bags/...` — those are shared assets).
  const keptSet = new Set(
    photoPlan.filter((i): i is { kind: 'existing'; path: string } => i.kind === 'existing').map((i) => i.path),
  )
  const deletes: string[] = []
  for (const oldPath of original.photos ?? []) {
    if (keptSet.has(oldPath)) continue
    if (!oldPath.startsWith(photoPrefixUrl)) continue
    // Convert public URL ("/pantry-photos/foo.jpg") to repo path ("public/pantry-photos/foo.jpg").
    deletes.push('public' + oldPath)
  }

  const updated: PantryEntry = {
    slug: bag.slug,
    encyclopediaId: bag.encyclopediaId,
    name: bag.name,
    storeNumber: bag.storeNumber,
    dateAcquired: bag.dateAcquired,
    memory: bag.memory,
    photos: finalPhotos,
    ...(original.parkerPhoto ? { parkerPhoto: original.parkerPhoto } : {}),
  }
  pantry[idx] = updated

  const newContent = JSON.stringify(pantry, null, 2) + '\n'
  writes.push({ path: c.env.PANTRY_PATH, contentBase64: utf8ToBase64(newContent) })

  try {
    const result = await ghCommitMany(
      c.env,
      { writes, deletes },
      `Edit bag: ${bag.name}`,
    )
    return c.json({
      ok: true,
      slug: bag.slug,
      photos: finalPhotos,
      commitUrl: result.commitUrl,
    })
  } catch (err) {
    return c.json({ error: `Failed to commit: ${(err as Error).message}` }, 502)
  }
})

/* ──────────────────────────  /pantry/delete  ──────────────────────────
   Removes an entry from pantry.json and deletes its photo files (only
   those under PHOTOS_PATH_PREFIX — curated reference photos stay). */

app.post('/pantry/delete', async (c) => {
  let body: { password?: string; slug?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const { password, slug } = body
  if (!password || !slug) {
    return c.json({ error: 'Missing password or slug' }, 400)
  }

  const incomingHash = await sha256Hex(password)
  if (!constantTimeEqual(incomingHash, c.env.ADMIN_HASH)) {
    return c.json({ error: 'Wrong password' }, 401)
  }

  let existing: { content: string; sha: string }
  try {
    existing = await ghReadFile(c.env, c.env.PANTRY_PATH)
  } catch (err) {
    return c.json({ error: `Failed to read pantry: ${(err as Error).message}` }, 502)
  }

  type PantryEntry = { slug: string; name?: string; photos?: string[] }
  let pantry: PantryEntry[]
  try {
    const parsed = JSON.parse(existing.content)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    pantry = parsed
  } catch {
    return c.json({ error: 'pantry.json is not valid JSON array' }, 502)
  }

  const idx = pantry.findIndex((b) => b.slug === slug)
  if (idx === -1) {
    return c.json({ error: `No entry with slug "${slug}"`, code: 'not_found' }, 404)
  }

  const removed = pantry[idx]
  const photoPrefixUrl = '/' + c.env.PHOTOS_PATH_PREFIX.replace(/^public\//, '') + '/'
  const deletes: string[] = []
  for (const oldPath of removed.photos ?? []) {
    if (!oldPath.startsWith(photoPrefixUrl)) continue
    deletes.push('public' + oldPath)
  }

  pantry.splice(idx, 1)
  const newContent = JSON.stringify(pantry, null, 2) + '\n'
  const writes = [{ path: c.env.PANTRY_PATH, contentBase64: utf8ToBase64(newContent) }]

  try {
    const result = await ghCommitMany(
      c.env,
      { writes, deletes },
      `Delete bag: ${removed.name ?? slug}`,
    )
    return c.json({ ok: true, slug, commitUrl: result.commitUrl })
  } catch (err) {
    return c.json({ error: `Failed to commit: ${(err as Error).message}` }, 502)
  }
})

function validateBag(bag: IncomingBag): string | null {
  if (!bag.slug || !/^[a-z0-9-]{1,80}$/.test(bag.slug)) {
    return 'Invalid slug (lowercase letters, numbers, hyphens; max 80)'
  }
  if (!bag.name || bag.name.length > 120) return 'Invalid bag name'
  if (!bag.storeNumber || !/^[a-zA-Z0-9-]{1,16}$/.test(bag.storeNumber)) {
    return 'Invalid storeNumber'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bag.dateAcquired)) {
    return 'Invalid dateAcquired (YYYY-MM-DD)'
  }
  if (!bag.memory || bag.memory.length > 4000) return 'Invalid memory'
  return null
}

/* ──────────────────────────  /settings  ──────────────────────────
   Generic settings endpoint that persists a JSON value at a known
   per-key file path. Keys are allowlisted so the path can't be
   injected. Use a single shared endpoint instead of one per setting
   so future toggles (e.g. wiring up pins) reuse this surface. */

const SETTINGS_FILES: Record<string, string> = {
  visibility: 'public/data/visibility.json',
  pins: 'public/data/pins.json',
}

app.post('/settings', async (c) => {
  let body: { password?: string; key?: string; value?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const { password, key, value } = body
  if (!password) return c.json({ error: 'Missing password' }, 400)
  if (!key || typeof key !== 'string' || !(key in SETTINGS_FILES)) {
    return c.json({ error: 'Unknown settings key' }, 400)
  }
  if (value === undefined) return c.json({ error: 'Missing value' }, 400)

  const incomingHash = await sha256Hex(password)
  if (!constantTimeEqual(incomingHash, c.env.ADMIN_HASH)) {
    return c.json({ error: 'Wrong password' }, 401)
  }

  const path = SETTINGS_FILES[key]

  // We need the existing sha to PUT an update via the contents API; if the
  // file doesn't exist yet (404), fall through and let the write create it.
  let sha: string | undefined
  try {
    const existing = await ghReadFile(c.env, path)
    sha = existing.sha
  } catch (err) {
    const msg = (err as Error).message
    if (!msg.includes('404')) {
      return c.json({ error: `Failed to read ${key}: ${msg}` }, 502)
    }
  }

  const content = JSON.stringify(value, null, 2) + '\n'
  try {
    const result = await ghWriteFile(
      c.env,
      path,
      utf8ToBase64(content),
      `Update ${key} settings`,
      sha,
    )
    return c.json({ ok: true, key, commitUrl: result.commit.html_url })
  } catch (err) {
    return c.json({ error: `Failed to commit ${key}: ${(err as Error).message}` }, 502)
  }
})

/* ──────────────────────────  /suggestions  ───────────────────────── */

type IncomingSuggestion = {
  name: string
  type?: 'state' | 'special' | 'standard'
  state?: string
  stateCode?: string
  region?: string
  year?: number
  materials?: ('canvas' | 'polypropylene' | 'jute' | 'paper' | 'insulated' | 'nylon')[]
  notes?: string
  submitterContact?: string
  turnstileToken: string
}

app.post('/suggestions', async (c) => {
  let body: IncomingSuggestion
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  if (!body.name || body.name.length > 120) {
    return c.json({ error: 'Invalid name' }, 400)
  }
  if (!body.turnstileToken) {
    return c.json({ error: 'Missing captcha token' }, 400)
  }

  // 1. Verify Turnstile token.
  const remoteIp = c.req.header('CF-Connecting-IP') ?? undefined
  const verifyResult = await verifyTurnstile(c.env.TURNSTILE_SECRET, body.turnstileToken, remoteIp)
  if (!verifyResult.success) {
    return c.json({ error: 'Captcha failed', codes: verifyResult.errorCodes }, 403)
  }

  // 2. Open a GitHub issue.
  try {
    const issue = await ghCreateIssue(c.env, {
      title: `Bag suggestion: ${body.name.slice(0, 80)}`,
      body: formatSuggestionBody(body),
      labels: ['bag-suggestion'],
    })
    return c.json({ ok: true, issueUrl: issue.html_url })
  } catch (err) {
    return c.json({ error: `Failed to create issue: ${(err as Error).message}` }, 502)
  }
})

function formatSuggestionBody(s: IncomingSuggestion): string {
  const lines = [
    `**Bag name:** ${s.name}`,
    `**Type:** ${s.type ?? '(unspecified)'}`,
  ]
  if (s.state) lines.push(`**State:** ${s.state}${s.stateCode ? ` (${s.stateCode})` : ''}`)
  if (s.region) lines.push(`**Region/city:** ${s.region}`)
  if (s.year) lines.push(`**Year:** ${s.year}`)
  if (s.materials?.length) lines.push(`**Materials:** ${s.materials.join(', ')}`)
  if (s.notes) lines.push('', '**Notes:**', s.notes)
  if (s.submitterContact) lines.push('', `_Submitted by:_ ${s.submitterContact}`)
  lines.push('', '---', '_Submitted via the public suggestion form on the encyclopedia page._')
  return lines.join('\n')
}

/* ──────────────────────────  GitHub helpers  ─────────────────────── */

const GH_API = 'https://api.github.com'

function ghHeaders(env: Env): HeadersInit {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'parker-bags-worker',
  }
}

async function ghReadFile(
  env: Env,
  path: string,
): Promise<{ content: string; sha: string }> {
  const url = `${GH_API}/repos/${env.GITHUB_REPO}/contents/${encodePath(path)}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`
  const res = await fetch(url, { headers: ghHeaders(env) })
  if (!res.ok) {
    throw new Error(`GET ${path}: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { content: string; encoding: string; sha: string }
  if (data.encoding !== 'base64') throw new Error(`Unexpected encoding: ${data.encoding}`)
  // GitHub wraps base64 with newlines every 60 chars.
  const content = base64ToUtf8(data.content.replace(/\n/g, ''))
  return { content, sha: data.sha }
}

async function ghWriteFile(
  env: Env,
  path: string,
  contentBase64: string,
  message: string,
  sha?: string,
): Promise<{ commit: { html_url: string; sha: string }; content: { sha: string } }> {
  const url = `${GH_API}/repos/${env.GITHUB_REPO}/contents/${encodePath(path)}`
  const body = {
    message,
    content: contentBase64,
    branch: env.GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`PUT ${path}: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<{
    commit: { html_url: string; sha: string }
    content: { sha: string }
  }>
}

/**
 * Commit any number of files in a single commit via the Git Data API. Why
 * this instead of the simpler contents API: contents-API writes are one-
 * file-per-commit, so a bag submission with N photos used to land as N+1
 * commits — each kicking off a Pages deploy that the next one cancelled.
 * This bundles everything into one commit, one deploy, atomic.
 *
 * Supports writes (create-or-update) and deletes. Deletes are expressed in
 * the new tree as entries with sha: null, which removes the path from the
 * resulting tree (history is preserved).
 *
 * Sequence: create a blob per write (parallel) → look up the branch head's
 * commit + tree → build a new tree layered on top → create a new commit
 * pointing at it → fast-forward the branch ref.
 */
async function ghCommitMany(
  env: Env,
  changes: {
    writes?: { path: string; contentBase64: string }[]
    deletes?: string[]
  },
  message: string,
): Promise<{ commitUrl: string; commitSha: string }> {
  const writes = changes.writes ?? []
  const deletes = changes.deletes ?? []
  if (writes.length === 0 && deletes.length === 0) {
    throw new Error('ghCommitMany called with no changes')
  }

  const jsonHeaders = { ...ghHeaders(env), 'Content-Type': 'application/json' }
  const repoBase = `${GH_API}/repos/${env.GITHUB_REPO}`
  const branchRef = `heads/${encodeURIComponent(env.GITHUB_BRANCH)}`

  // 1. Create one blob per write (parallelizable — no cross-blob ordering).
  const blobs = await Promise.all(
    writes.map(async (f) => {
      const res = await fetch(`${repoBase}/git/blobs`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ content: f.contentBase64, encoding: 'base64' }),
      })
      if (!res.ok) {
        throw new Error(`Create blob ${f.path}: ${res.status} ${await res.text()}`)
      }
      const data = (await res.json()) as { sha: string }
      return { path: f.path, sha: data.sha }
    }),
  )

  // 2. Branch ref → head commit sha.
  const refRes = await fetch(`${repoBase}/git/ref/${branchRef}`, {
    headers: ghHeaders(env),
  })
  if (!refRes.ok) {
    throw new Error(`Read ref: ${refRes.status} ${await refRes.text()}`)
  }
  const headSha = ((await refRes.json()) as { object: { sha: string } }).object.sha

  // 3. Head commit → base tree sha.
  const commitRes = await fetch(`${repoBase}/git/commits/${headSha}`, {
    headers: ghHeaders(env),
  })
  if (!commitRes.ok) {
    throw new Error(`Read commit: ${commitRes.status} ${await commitRes.text()}`)
  }
  const baseTreeSha = ((await commitRes.json()) as { tree: { sha: string } }).tree.sha

  // 4. New tree layered on top of base tree.
  const treeEntries: {
    path: string
    mode: '100644'
    type: 'blob'
    sha: string | null
  }[] = [
    ...blobs.map((b) => ({
      path: b.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: b.sha,
    })),
    ...deletes.map((path) => ({
      path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: null,
    })),
  ]
  const treeRes = await fetch(`${repoBase}/git/trees`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeEntries,
    }),
  })
  if (!treeRes.ok) {
    throw new Error(`Create tree: ${treeRes.status} ${await treeRes.text()}`)
  }
  const newTreeSha = ((await treeRes.json()) as { sha: string }).sha

  // 5. Commit pointing at the new tree, parented on the current head.
  const newCommitRes = await fetch(`${repoBase}/git/commits`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      message,
      tree: newTreeSha,
      parents: [headSha],
    }),
  })
  if (!newCommitRes.ok) {
    throw new Error(`Create commit: ${newCommitRes.status} ${await newCommitRes.text()}`)
  }
  const newCommit = (await newCommitRes.json()) as { sha: string; html_url: string }

  // 6. Fast-forward the branch. A 422 here means someone raced us — fine,
  //    surface a clear error and let the admin retry; the duplicate-slug
  //    check already prevents double-adds.
  const patchRes = await fetch(`${repoBase}/git/refs/${branchRef}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ sha: newCommit.sha }),
  })
  if (!patchRes.ok) {
    throw new Error(`Update ref: ${patchRes.status} ${await patchRes.text()}`)
  }

  return { commitUrl: newCommit.html_url, commitSha: newCommit.sha }
}

async function ghCreateIssue(
  env: Env,
  { title, body, labels }: { title: string; body: string; labels: string[] },
): Promise<{ html_url: string; number: number }> {
  const url = `${GH_API}/repos/${env.GITHUB_REPO}/issues`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...ghHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, labels }),
  })
  if (!res.ok) {
    throw new Error(`POST issues: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<{ html_url: string; number: number }>
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

/* ──────────────────────────  Turnstile  ──────────────────────────── */

async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp?: string,
): Promise<{ success: boolean; errorCodes?: string[] }> {
  const params = new URLSearchParams()
  params.append('secret', secret)
  params.append('response', token)
  if (remoteIp) params.append('remoteip', remoteIp)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      success: false,
      errorCodes: [`http-${res.status}`, text.slice(0, 200) || 'no-body'],
    }
  }
  const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] }
  return { success: data.success === true, errorCodes: data['error-codes'] }
}

/* ──────────────────────────  Crypto/encoding utils  ──────────────── */

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function randomId(len: number): string {
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, len)
}

function sanitizeExtension(filename: string): string {
  const m = filename.toLowerCase().match(/\.([a-z0-9]{1,5})$/)
  if (!m) return ''
  const ext = m[1]
  const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'])
  return allowed.has(ext) ? `.${ext}` : ''
}

export default app
