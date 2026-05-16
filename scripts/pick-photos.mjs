#!/usr/bin/env node
/**
 * Local HTTP picker for scraped staging photos. Hover a tile and press 1-5 to
 * assign front/back/left/right/bottom. Finalize runs background removal and
 * writes `public/bags/[<material>/]<slug>/<angle>.png` plus a referencePhotos
 * update on the matching encyclopedia.json entry.
 *
 * Run with:  npm run pick:photos
 */

import http from 'node:http'
import {
  readdir,
  readFile,
  writeFile,
  mkdir,
} from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// sharp + @imgly are loaded lazily inside Finalize, and `sharp` is pulled from
// @imgly's nested copy on purpose: a top-level sharp would load a second
// libvips into the process and crash with ERR_DLOPEN_FAILED on Windows.

// Vite walks the 517x range when its default is busy, which silently shadows
// the picker. Override with `PORT=xxxx npm run pick:photos` if 5757 is taken.
const PORT = Number(process.env.PORT) || 5757
const ANGLES = ['front', 'back', 'left', 'right', 'bottom']

// Keep in sync with the on-disk layout under public/bags/. Moving a bag
// between groupings means moving the folder AND clearing its referencePhotos.
const MATERIAL_FOLDERS = {
  jute: 'jute-bags',
  canvas: 'canvas-bags',
}
const TYPE_FOLDERS = {
  state: 'locations',
}

function bagSubpath(entry, slug) {
  if (entry?.type && TYPE_FOLDERS[entry.type]) {
    return `${TYPE_FOLDERS[entry.type]}/${slug}`
  }
  const m = entry?.materials?.find((x) => MATERIAL_FOLDERS[x])
  return m ? `${MATERIAL_FOLDERS[m]}/${slug}` : slug
}
const CROP_PADDING = 0.04
const CROP_ASPECT_RATIO = 4 / 5

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const STAGING_DIR = resolve(ROOT, 'staging')
const PUBLIC_BAGS_DIR = resolve(ROOT, 'public', 'bags')
const ENCYCLOPEDIA_PATH = resolve(ROOT, 'public', 'data', 'encyclopedia.json')

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function safeSegment(s) {
  return /^[A-Za-z0-9._-]+$/.test(s)
}

async function scanStaging() {
  if (!existsSync(STAGING_DIR)) return []

  // To redo a bag, clear its referencePhotos in encyclopedia.json by hand
  // before relaunching — otherwise the picker hides it as already finalized.
  let finalizedSlugs = new Set()
  try {
    const enc = JSON.parse(await readFile(ENCYCLOPEDIA_PATH, 'utf8'))
    finalizedSlugs = new Set(
      enc
        .filter((e) => Array.isArray(e.referencePhotos) && e.referencePhotos.length > 0)
        .map((e) => e.id),
    )
  } catch {}

  const entries = await readdir(STAGING_DIR, { withFileTypes: true })
  const bags = []
  let skippedCount = 0
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const slug = e.name
    if (finalizedSlugs.has(slug)) {
      skippedCount++
      continue
    }
    const listings = await readdir(resolve(STAGING_DIR, slug), {
      withFileTypes: true,
    })
    const listingObjs = []
    for (const l of listings) {
      if (!l.isDirectory()) continue
      const photos = (
        await readdir(resolve(STAGING_DIR, slug, l.name))
      ).filter((f) => Object.keys(MIME).includes(extname(f).toLowerCase()))
      if (photos.length) listingObjs.push({ listingId: l.name, photos })
    }
    if (listingObjs.length) bags.push({ slug, listings: listingObjs })
  }
  if (skippedCount > 0) {
    console.log(`  Skipping ${skippedCount} finalized bag(s) from staging.`)
  }
  return bags
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function updateEncyclopedia(slug, newSources = {}) {
  // referencePhotos reflects whatever angles exist on disk, in canonical
  // ANGLES order — stable across re-runs, partial sets (front+back only) OK.
  const entries = await readJson(ENCYCLOPEDIA_PATH)
  const idx = entries.findIndex((e) => e.id === slug)
  if (idx === -1) {
    console.log(`  encyclopedia.json: no entry with id "${slug}" — skipping update`)
    return
  }
  const subpath = bagSubpath(entries[idx], slug)
  const outDir = resolve(PUBLIC_BAGS_DIR, ...subpath.split('/'))
  const present = ANGLES.filter((a) => existsSync(resolve(outDir, `${a}.png`)))
  if (present.length === 0) return

  entries[idx].referencePhotos = present.map((a) => `bags/${subpath}/${a}.png`)

  const existingSources = entries[idx].referencePhotoSources ?? {}
  const merged = {}
  for (const a of present) {
    if (newSources[a]) merged[a] = newSources[a]
    else if (existingSources[a]) merged[a] = existingSources[a]
  }
  if (Object.keys(merged).length > 0) {
    entries[idx].referencePhotoSources = merged
  } else {
    delete entries[idx].referencePhotoSources
  }

  await writeFile(
    ENCYCLOPEDIA_PATH,
    JSON.stringify(entries, null, 2) + '\n',
    'utf8',
  )
}

async function cropToSubject(sharp, pngBuffer) {
  // Two-step (extract then extend) is deliberate: doing it in one pipeline
  // crashed libvips with "extract_area: bad extract area" on rounding edges.
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const threshold = 16

  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    const row = y * width * channels
    for (let x = 0; x < width; x++) {
      if (data[row + x * channels + 3] > threshold) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return pngBuffer

  const bboxW = maxX - minX + 1
  const bboxH = maxY - minY + 1
  const padPx = Math.round(Math.max(bboxW, bboxH) * CROP_PADDING)

  const trimLeft = Math.max(0, minX - padPx)
  const trimTop = Math.max(0, minY - padPx)
  const trimRight = Math.min(width, maxX + 1 + padPx)
  const trimBottom = Math.min(height, maxY + 1 + padPx)
  const trimW = trimRight - trimLeft
  const trimH = trimBottom - trimTop

  const trimmedBuf = await sharp(pngBuffer)
    .extract({ left: trimLeft, top: trimTop, width: trimW, height: trimH })
    .png()
    .toBuffer()

  let targetW = trimW
  let targetH = trimH
  if (trimW / trimH < CROP_ASPECT_RATIO) {
    targetW = Math.round(trimH * CROP_ASPECT_RATIO)
  } else {
    targetH = Math.round(trimW / CROP_ASPECT_RATIO)
  }
  const padW = Math.max(0, targetW - trimW)
  const padH = Math.max(0, targetH - trimH)
  if (padW === 0 && padH === 0) return trimmedBuf

  const left = Math.floor(padW / 2)
  const top = Math.floor(padH / 2)
  return sharp(trimmedBuf)
    .extend({
      left,
      right: padW - left,
      top,
      bottom: padH - top,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

async function processFinalize(assignments) {
  let removeBackground, sharp
  try {
    ;({ removeBackground } = await import('@imgly/background-removal-node'))
  } catch (err) {
    console.error('Failed to load @imgly/background-removal-node:', err)
    throw new Error(`@imgly load failed: ${err.message || err}`)
  }
  try {
    const nestedSharp = resolve(
      ROOT,
      'node_modules/@imgly/background-removal-node/node_modules/sharp/lib/index.js',
    )
    sharp = (await import(pathToFileURL(nestedSharp).href)).default
  } catch (err) {
    console.error('Failed to load sharp:', err)
    throw new Error(`sharp load failed: ${err.message || err}`)
  }

  const bySlug = new Map()
  for (const a of assignments) {
    if (!bySlug.has(a.slug)) bySlug.set(a.slug, [])
    bySlug.get(a.slug).push(a)
  }

  const enc = await readJson(ENCYCLOPEDIA_PATH)
  const entryBySlug = new Map(enc.map((e) => [e.id, e]))

  const log = []
  for (const [slug, items] of bySlug) {
    const subpath = bagSubpath(entryBySlug.get(slug), slug)
    const outDir = resolve(PUBLIC_BAGS_DIR, ...subpath.split('/'))
    await mkdir(outDir, { recursive: true })

    const newSources = {}
    for (const a of items) {
      const srcPath = resolve(STAGING_DIR, a.slug, a.listingId, a.photo)
      const outPath = resolve(outDir, `${a.angle}.png`)
      try {
        const inputBuf = await readFile(srcPath)
        const mime = MIME[extname(srcPath).toLowerCase()] ?? 'image/jpeg'
        const inputBlob = new Blob([inputBuf], { type: mime })
        const outBlob = await removeBackground(inputBlob, {
          output: { format: 'image/png' },
        })
        const rawBuf = Buffer.from(await outBlob.arrayBuffer())
        const croppedBuf = await cropToSubject(sharp, rawBuf)
        await writeFile(outPath, croppedBuf)
        newSources[a.angle] = `https://poshmark.com/listing/${a.listingId}`
        log.push(`  ✓ ${subpath}/${a.angle}.png`)
      } catch (err) {
        log.push(`  ✗ ${subpath}/${a.angle}.png — ${err.message}`)
      }
    }

    await updateEncyclopedia(slug, newSources)
    const written = ANGLES.filter((a) =>
      existsSync(resolve(outDir, `${a}.png`)),
    )
    log.push(`  ↳ ${slug} now has [${written.join(', ')}] in encyclopedia.json`)
  }
  return log
}

function send(res, status, body, contentType = 'text/plain') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

async function handleRequest(req, res) {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (req.method === 'GET' && url.pathname === '/') {
    return send(res, 200, renderHtml(), 'text/html; charset=utf-8')
  }

  if (req.method === 'GET' && url.pathname === '/api/state') {
    const bags = await scanStaging()
    return send(res, 200, JSON.stringify({ bags }), 'application/json')
  }

  if (req.method === 'GET' && url.pathname.startsWith('/photo/')) {
    const parts = url.pathname.split('/').slice(2)
    if (parts.length !== 3 || !parts.every(safeSegment)) {
      return send(res, 400, 'bad path')
    }
    const [slug, listingId, file] = parts
    const filePath = resolve(STAGING_DIR, slug, listingId, file)
    if (!filePath.startsWith(STAGING_DIR)) return send(res, 400, 'bad path')
    try {
      const buf = await readFile(filePath)
      return send(res, 200, buf, MIME[extname(file).toLowerCase()] ?? 'application/octet-stream')
    } catch {
      return send(res, 404, 'not found')
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/finalize') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', async () => {
      try {
        const { assignments } = JSON.parse(body)
        if (!Array.isArray(assignments) || assignments.length === 0) {
          return send(res, 400, JSON.stringify({ error: 'no assignments' }), 'application/json')
        }
        for (const a of assignments) {
          if (
            !a.slug || !a.listingId || !a.photo || !a.angle ||
            !safeSegment(a.slug) || !safeSegment(a.listingId) || !safeSegment(a.photo) ||
            !ANGLES.includes(a.angle)
          ) {
            return send(res, 400, JSON.stringify({ error: 'bad assignment shape' }), 'application/json')
          }
        }
        const log = await processFinalize(assignments)
        return send(res, 200, JSON.stringify({ log }), 'application/json')
      } catch (err) {
        return send(res, 500, JSON.stringify({ error: err.message }), 'application/json')
      }
    })
    return
  }

  return send(res, 404, 'not found')
}

function renderHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Bag photo picker</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    background: #f6f3ee; color: #2a2a2a;
  }
  header {
    position: sticky; top: 0; z-index: 10;
    background: #fff; border-bottom: 1px solid #ddd;
    padding: 0.75rem 1rem; display: flex; align-items: center; gap: 1rem;
  }
  header h1 { font-size: 1rem; margin: 0; white-space: nowrap; }
  header .progress { font-size: 0.85rem; color: #666; }
  header .progress strong { color: #2a2a2a; }
  header .spacer { margin-left: auto; }
  header button {
    border: none; padding: 0.5rem 1rem; border-radius: 4px;
    font-size: 0.9rem; cursor: pointer;
  }
  header button:disabled { background: #bbb !important; cursor: not-allowed; color: white; }
  header button.primary { background: #c0392b; color: white; }
  header button.skip { background: #888; color: white; margin-right: 0.5rem; }
  main { padding: 1rem; max-width: 1400px; margin: 0 auto; }
  .bag { margin-bottom: 2rem; background: white; border-radius: 8px; padding: 1rem; }
  .bag h2 { margin: 0 0 0.25rem; font-size: 1.05rem; }
  .bag .meta { font-size: 0.8rem; color: #666; margin-bottom: 0.75rem; }
  .bag .meta .done { color: #2a8f3c; font-weight: 600; }
  .listing { border-top: 1px dashed #ddd; padding-top: 0.75rem; margin-top: 0.75rem; }
  .listing .lid { font-size: 0.7rem; color: #999; margin-bottom: 0.5rem; font-family: ui-monospace, monospace; }
  .listing .lid a { color: inherit; text-decoration: none; border-bottom: 1px dotted #bbb; }
  .listing .lid a:hover { color: #c0392b; border-bottom-color: #c0392b; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
  }
  .tile {
    background: #fafafa; border: 2px solid transparent; border-radius: 6px;
    padding: 0.5rem; transition: border-color 0.1s;
  }
  .tile.has-angle { border-color: #2a8f3c; }
  .tile img {
    width: 100%; aspect-ratio: 4/5; object-fit: cover;
    border-radius: 4px; background: #eee; cursor: pointer;
  }
  .tile .angles {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 0.25rem; margin-top: 0.5rem;
  }
  .tile .angles button {
    font-size: 0.7rem; font-weight: 600; padding: 0.35rem 0;
    border: 1px solid #ccc; background: white; border-radius: 3px;
    cursor: pointer; color: #555;
  }
  .tile .angles button.active {
    background: #2a8f3c; color: white; border-color: #2a8f3c;
  }
  .empty { padding: 2rem; text-align: center; color: #888; }
  #log {
    position: fixed; bottom: 0; left: 0; right: 0; max-height: 40vh;
    overflow-y: auto; background: #1a1a1a; color: #d8d8d8; padding: 0.75rem 1rem;
    font-family: ui-monospace, monospace; font-size: 0.8rem;
    transform: translateY(100%); transition: transform 0.2s;
  }
  #log.open { transform: translateY(0); }
  #log h3 { margin: 0 0 0.5rem; color: white; font-size: 0.85rem; }
  #log pre { margin: 0; white-space: pre-wrap; }
</style>
</head>
<body>
<header>
  <h1>Bag photo picker</h1>
  <span class="progress" id="progress">loading…</span>
  <span class="spacer"></span>
  <button id="skip" class="skip" type="button">Skip →</button>
  <button id="finalize" class="primary" type="button" disabled>Finalize & Next →</button>
</header>
<main id="main">
  <div class="empty">Loading staged photos…</div>
</main>
<div id="log"><h3>finalize log</h3><pre id="logbody"></pre></div>

<script>
const ANGLES = ${JSON.stringify(ANGLES)};
const ANGLE_KEYS = { '1': 'front', '2': 'back', '3': 'left', '4': 'right', '5': 'bottom' };
const ANGLE_LABEL = { front: 'F', back: 'B', left: 'L', right: 'R', bottom: 'Btm' };

const state = { bags: [], assignments: new Map(), currentIndex: 0 };
let hoveredKey = null;

async function load() {
  const r = await fetch('/api/state');
  const { bags } = await r.json();
  state.bags = bags;
  for (const b of bags) state.assignments.set(b.slug, new Map());
  render();
}

function currentBag() {
  return state.bags[state.currentIndex] ?? null;
}

function advance() {
  state.currentIndex++;
  window.scrollTo({ top: 0, behavior: 'instant' });
  render();
}

function getAssigned(slug, listingId, photo) {
  const m = state.assignments.get(slug);
  if (!m) return null;
  for (const [angle, ref] of m) {
    if (ref.listingId === listingId && ref.photo === photo) return angle;
  }
  return null;
}

function assign(slug, listingId, photo, angle) {
  const m = state.assignments.get(slug);
  const existing = m.get(angle);
  if (existing && existing.listingId === listingId && existing.photo === photo) {
    m.delete(angle);
  } else {
    m.set(angle, { listingId, photo });
  }
  render();
}

function render() {
  const main = document.getElementById('main');
  const progressEl = document.getElementById('progress');
  const skipBtn = document.getElementById('skip');
  const finalizeBtn = document.getElementById('finalize');

  if (state.bags.length === 0) {
    main.innerHTML = '<div class="empty">No photos in staging/. Run <code>node scripts/scrape-poshmark.mjs</code> first.</div>';
    progressEl.textContent = '';
    skipBtn.style.display = 'none';
    finalizeBtn.style.display = 'none';
    return;
  }

  const bag = currentBag();
  if (!bag) {
    main.innerHTML = \`
      <div class="empty">
        <h2 style="margin: 0 0 0.5rem; font-size: 1.4rem; color: #2a8f3c;">✓ All bags processed</h2>
        <p>You can close this tab. Run <code>npm run dev</code> to see them in the encyclopedia.</p>
      </div>\`;
    progressEl.innerHTML = \`<strong>Done</strong> · \${state.bags.length}/\${state.bags.length}\`;
    skipBtn.style.display = 'none';
    finalizeBtn.style.display = 'none';
    return;
  }

  skipBtn.style.display = '';
  finalizeBtn.style.display = '';

  const a = state.assignments.get(bag.slug);
  const count = a.size;
  const pickedAngles = Array.from(a.keys()).sort((x, y) => ANGLES.indexOf(x) - ANGLES.indexOf(y));
  const statusLabel = count === 0
    ? 'nothing picked yet'
    : \`<span class="done">\${count} picked</span> · \${pickedAngles.join(' · ')}\`;

  const listingHtml = bag.listings.map(l => {
    const tiles = l.photos.map(photo => {
      const assigned = getAssigned(bag.slug, l.listingId, photo);
      const tileClass = assigned ? 'tile has-angle' : 'tile';
      const photoKey = bag.slug + '/' + l.listingId + '/' + photo;
      const btns = ANGLES.map(angle => {
        const isActive = assigned === angle;
        return \`<button class="\${isActive ? 'active' : ''}" data-angle="\${angle}" data-slug="\${bag.slug}" data-lid="\${l.listingId}" data-photo="\${photo}">\${ANGLE_LABEL[angle]}</button>\`;
      }).join('');
      return \`
        <div class="\${tileClass}" data-key="\${photoKey}">
          <img src="/photo/\${bag.slug}/\${l.listingId}/\${photo}" loading="lazy" />
          <div class="angles">\${btns}</div>
        </div>\`;
    }).join('');
    const listingHref = 'https://poshmark.com/listing/' + l.listingId;
    return \`<div class="listing"><div class="lid">listing <a href="\${listingHref}" target="_blank" rel="noopener">\${l.listingId} ↗</a></div><div class="grid">\${tiles}</div></div>\`;
  }).join('');

  main.innerHTML = \`<section class="bag"><h2>\${bag.slug}</h2><div class="meta">\${statusLabel}</div>\${listingHtml}</section>\`;

  main.querySelectorAll('.angles button').forEach(b => {
    b.addEventListener('click', () => {
      assign(b.dataset.slug, b.dataset.lid, b.dataset.photo, b.dataset.angle);
    });
  });
  main.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('mouseenter', () => { hoveredKey = tile.dataset.key; });
    tile.addEventListener('mouseleave', () => { if (hoveredKey === tile.dataset.key) hoveredKey = null; });
  });

  const isLast = state.currentIndex === state.bags.length - 1;
  progressEl.innerHTML = \`Bag <strong>\${state.currentIndex + 1}</strong>/\${state.bags.length} · \${bag.slug}\`;
  finalizeBtn.textContent = isLast ? 'Finalize & Finish' : 'Finalize & Next →';
  finalizeBtn.disabled = count === 0;
}

document.addEventListener('keydown', (e) => {
  if (!hoveredKey || !ANGLE_KEYS[e.key]) return;
  // safe split: photo filenames have no slashes, so the key is always 3 parts.
  const [slug, listingId, photo] = hoveredKey.split('/');
  assign(slug, listingId, photo, ANGLE_KEYS[e.key]);
});

document.getElementById('skip').addEventListener('click', () => {
  advance();
});

document.getElementById('finalize').addEventListener('click', async () => {
  const bag = currentBag();
  if (!bag) return;
  const finalizeBtn = document.getElementById('finalize');
  const skipBtn = document.getElementById('skip');
  finalizeBtn.disabled = true;
  skipBtn.disabled = true;
  finalizeBtn.textContent = 'Processing…';

  const logEl = document.getElementById('log');
  const logBody = document.getElementById('logbody');
  logBody.textContent = \`Processing \${bag.slug} — background removal + crop…\\n\`;
  logEl.classList.add('open');

  const m = state.assignments.get(bag.slug);
  const assignments = [];
  for (const [angle, ref] of m) {
    assignments.push({ slug: bag.slug, listingId: ref.listingId, photo: ref.photo, angle });
  }

  try {
    const r = await fetch('/api/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments }),
    });
    const data = await r.json();
    if (data.error) {
      logBody.textContent += '\\nERROR: ' + data.error + '\\n';
      finalizeBtn.disabled = false;
      skipBtn.disabled = false;
      finalizeBtn.textContent = 'Finalize & Next →';
      return;
    }
    logBody.textContent += '\\n' + data.log.join('\\n') + '\\n';
  } catch (err) {
    logBody.textContent += '\\nfetch failed: ' + err.message;
    finalizeBtn.disabled = false;
    skipBtn.disabled = false;
    finalizeBtn.textContent = 'Finalize & Next →';
    return;
  }

  skipBtn.disabled = false;
  advance();
});

load();
</script>
</body>
</html>`
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error(err)
    send(res, 500, err.message)
  })
})
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use — something else is bound to it.`)
    console.error(`Run with a different port:  PORT=6173 npm run pick:photos`)
    process.exit(1)
  }
  throw err
})
server.listen(PORT, () => {
  console.log(`\n  Picker running at http://localhost:${PORT}\n`)
  console.log('  One bag at a time. Hover a photo + press 1/2/3/4/5 for front/back/left/right/bottom.')
  console.log('  Skip → moves on without finalizing. Finalize & Next → processes the current bag, then advances.\n')
})
