#!/usr/bin/env node
/**
 * Seeds `staging/<slug>/<listingId>/` with candidate Poshmark photos for the
 * picker step. Throttled to ~1 req/sec.
 *
 * Run with:  npm run scrape:poshmark
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const THROTTLE_MS = 800
const RETRIES = 2

const __dirname = dirname(fileURLToPath(import.meta.url))
const STAGING_DIR = resolve(__dirname, '..', 'staging')
const ENCYCLOPEDIA_PATH = resolve(__dirname, '..', 'public', 'data', 'encyclopedia.json')

// Slug must match an encyclopedia entry id — it doubles as the staging folder
// name and the picker writes back to `entries[id].referencePhotos`.
const QUERIES = {
  'tn': 'trader joes tennessee bag',
  'ga-atlanta': 'trader joes atlanta tote bag admit one peach',

  'pickle-cotton-bag': 'trader joes pickle bag',
  'sardine-bag': 'trader joes sardine bag',
  'recycled-ocean-plastic-bag': 'trader joes recycled ocean plastic bag',
  'comfort-food-bag': 'trader joes comfort food bag',
  'george-washington-peanuts': 'trader joes peanut bag george washington carver',
  'heritage-tote': 'trader joes vintage tote lowell ma jacquard',
  'home-cooking-with-joe': 'trader joes home cooking with joe tote crew member',
  moon: 'trader joes moon 2016 new year tote bag',
  'fearless-flyer-tote': 'trader joes fearless flyer tote',
  'corn-can-tote': 'trader joes corn can reusable bag whole kernel',
  'flower-shop-tote': 'trader joes flower shop floral tote',
  'surfboard-tote': 'trader joes surfboard reusable bag beach',
  'victorian-kitchen-tote': 'trader joes victorian kitchen canvas tote vintage',
  'chicken-citrus-tote': 'trader joes chicken citrus tote 2024',

  'coffee-jute-bag': 'trader joes coffee jute bag',
  'citrus-jute-bag': 'trader joes citrus jute bag',
  'jute-bag': 'trader joes jute tote braided handle',
  'vegetable-jute-bag': 'trader joes vegetable jute bag',
  'stock-keeping-unit-bag': 'trader joes mini jute tote stock keeping unit 95375',
  'cheese-adventure-canvas': 'trader joes cheese canvas tote',
  'perky-and-uni-corny': 'trader joes perky uni-corny owl unicorn tote bag',
  'ship': 'trader joes ship water tote bag ship in bottle map',
  'vintage-lady-tote': 'trader joes vintage lady fruit canvas tote',
  'vintage-produce-tote': 'trader joes vintage fruit vegetable cotton tote',
  'wine-reusable-bag': 'trader joes wine reusable bag',

  'insulated-reusable-bag': 'trader joes insulated cooler bag',
  'large-insulated-bag': 'trader joes large insulated cooler bag',
  'mini-insulated-tote': 'trader joes mini insulated tote',
  'mini-canvas-tote': 'trader joes mini canvas tote',
  'canvas-micro-tote': 'trader joes micro canvas tote',
  'micro-tote-with-grocery': 'trader joes micro tote grocery bag',
  'stand-up-collapsible': 'trader joes stand up collapsible grocery',
  'washable-paper-tote': 'trader joes washable paper tote',
  'washable-paper-grocery': 'trader joes washable paper grocery bag',
  'washable-paper-lunch': 'trader joes washable paper lunch bag',
  'bottle-holder-bag': 'trader joes bottle holder bag',
  'classic-reusable-tote': 'trader joes classic reusable grocery tote',
  'reusable-flower-bag': 'trader joes flower bag tall',
  'reusable-breakfast-tote': 'trader joes breakfast tote bag',

  'halloween-mini-canvas': 'trader joes halloween mini canvas tote',
  'pastel-mini-canvas': 'trader joes pastel mini canvas tote',
}

let lastRequestAt = 0
async function throttle() {
  const wait = Math.max(0, THROTTLE_MS - (Date.now() - lastRequestAt))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequestAt = Date.now()
}

async function fetchText(url, attempt = 0) {
  await throttle()
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } catch (err) {
    if (attempt < RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      return fetchText(url, attempt + 1)
    }
    throw err
  }
}

async function fetchBinary(url, attempt = 0) {
  await throttle()
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    if (attempt < RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      return fetchBinary(url, attempt + 1)
    }
    throw err
  }
}

function extractListingUrls(searchHtml) {
  const urls = new Set()
  for (const m of searchHtml.matchAll(/\/listing\/[A-Za-z0-9-]+/g)) {
    urls.add('https://poshmark.com' + m[0])
  }
  return Array.from(urls)
}

function listingIdFromUrl(url) {
  return url.match(/-([a-f0-9]{24})(?:[/?#]|$)/)?.[1] ?? null
}

function extractPhotoUrls(listingHtml, listingId) {
  // url_large URLs are embedded as JSON-escaped strings in the page's inline
  // Redux state — string-scan is cheaper and more resilient than parsing it.
  const out = new Set()
  for (const m of listingHtml.matchAll(/"url_large":"((?:[^"\\]|\\.)*)"/g)) {
    const url = m[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/')
    if (url.includes(listingId)) out.add(url)
  }
  return Array.from(out)
}

async function processTarget(target) {
  console.log(`\n=== ${target.slug} — "${target.query}" ===`)
  const searchUrl = `https://poshmark.com/search?query=${encodeURIComponent(target.query)}&type=listings`

  let listingUrls
  try {
    const searchHtml = await fetchText(searchUrl)
    listingUrls = extractListingUrls(searchHtml).slice(0, target.maxListings)
  } catch (err) {
    console.log(`  Search failed: ${err.message}`)
    return
  }
  console.log(`  Search returned ${listingUrls.length} listings`)
  if (listingUrls.length === 0) return

  const bagDir = resolve(STAGING_DIR, target.slug)
  await mkdir(bagDir, { recursive: true })

  let totalPhotos = 0
  for (const listingUrl of listingUrls) {
    const listingId = listingIdFromUrl(listingUrl)
    if (!listingId) {
      console.log(`  Skipping (no id): ${listingUrl}`)
      continue
    }

    try {
      const listingHtml = await fetchText(listingUrl)
      const photoUrls = extractPhotoUrls(listingHtml, listingId)
      if (photoUrls.length === 0) {
        console.log(`  ${listingId}: no photos extracted`)
        continue
      }

      const listingDir = resolve(bagDir, listingId)
      await mkdir(listingDir, { recursive: true })

      let saved = 0
      for (let i = 0; i < photoUrls.length; i++) {
        const ext = photoUrls[i].split('.').pop().toLowerCase()
        const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
        const fileName = `photo-${String(i + 1).padStart(2, '0')}.${safeExt}`
        try {
          const buf = await fetchBinary(photoUrls[i])
          await writeFile(resolve(listingDir, fileName), buf)
          saved++
        } catch (err) {
          console.log(`    photo ${i + 1} failed: ${err.message}`)
        }
      }
      console.log(`  ${listingId}: ${saved}/${photoUrls.length} photos saved`)
      totalPhotos += saved
    } catch (err) {
      console.log(`  ${listingId}: listing failed: ${err.message}`)
    }
  }
  console.log(`  total: ${totalPhotos} photos for ${target.slug}`)
}

async function targetsFromEncyclopedia() {
  const entries = JSON.parse(await readFile(ENCYCLOPEDIA_PATH, 'utf8'))
  const missing = entries.filter(
    (e) => !Array.isArray(e.referencePhotos) || e.referencePhotos.length === 0,
  )
  const targets = []
  const unmapped = []
  for (const e of missing) {
    if (QUERIES[e.id]) {
      targets.push({ slug: e.id, query: QUERIES[e.id], maxListings: 6 })
    } else {
      unmapped.push(e.id)
    }
  }
  if (unmapped.length) {
    console.log(`Skipping ${unmapped.length} entries with no QUERIES mapping:`)
    for (const id of unmapped) console.log(`  - ${id}`)
  }
  return targets
}

function printUsage() {
  console.log(`Usage:
  node scripts/scrape-poshmark.mjs --all-missing
      Scrape every encyclopedia entry that has no referencePhotos yet.

  node scripts/scrape-poshmark.mjs <slug>
      Scrape one bag (query auto-resolved from the QUERIES map).
      Example:  node scripts/scrape-poshmark.mjs coffee-jute-bag

  node scripts/scrape-poshmark.mjs <slug> "<query>" [maxListings]
      Scrape one bag with a custom search query.
`)
}

async function main() {
  const args = process.argv.slice(2)
  let targets

  if (args[0] === '--all-missing') {
    targets = await targetsFromEncyclopedia()
    if (targets.length === 0) {
      console.log('All encyclopedia entries already have referencePhotos.')
      return
    }
    console.log(
      `--all-missing: ${targets.length} bags need photos. ` +
        `Estimated runtime ~${Math.round((targets.length * 6 * 12 * 0.8) / 60)} min.`,
    )
  } else if (args.length >= 2) {
    targets = [{ slug: args[0], query: args[1], maxListings: Number(args[2]) || 6 }]
  } else if (args.length === 1 && QUERIES[args[0]]) {
    targets = [{ slug: args[0], query: QUERIES[args[0]], maxListings: 6 }]
  } else if (args.length === 1) {
    console.log(`No query in QUERIES for slug "${args[0]}". Either add it to the\nQUERIES map, or pass a query explicitly:\n  node scripts/scrape-poshmark.mjs ${args[0]} "trader joes ..."`)
    return
  } else {
    printUsage()
    return
  }

  await mkdir(STAGING_DIR, { recursive: true })
  for (const target of targets) {
    await processTarget(target)
  }
  console.log('\nDone. Next: `npm run pick:photos`')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
