#!/usr/bin/env node
/**
 * Scrapes locations.traderjoes.com to produce public/data/stores.json.
 *
 * Strategy: pull the sitemap, filter to store-detail URLs of the form
 *   /{state}/{city}/{storeNumber}/
 * then fetch each store page in parallel (bounded) and extract address +
 * phone from the og/meta tags.
 *
 * Run with:  node scripts/scrape-stores.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const SITEMAP_URL = 'https://locations.traderjoes.com/sitemap.xml'
const CONCURRENCY = 10
const RETRIES = 2

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '..', 'public', 'data', 'stores.json')

const STORE_URL_RE =
  /https:\/\/locations\.traderjoes\.com\/([a-z]{2})\/([^/]+)\/(\d+)\/?/g

function extractMeta(html, property) {
  const re = new RegExp(
    `<meta\\s+property=["']${property}["']\\s+content=["']([^"']*)["']`,
    'i',
  )
  return html.match(re)?.[1] ?? null
}

function extractTitle(html) {
  return html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? null
}

function extractZip(title) {
  // Title format: "Bedford (562) | Grocery Store in Bedford 03110"
  return title?.match(/\b(\d{5})\b/)?.[1] ?? null
}

function extractStoreName(title) {
  // "Bedford (562) | ..." -> "Bedford"
  return title?.match(/^([^(]+?)\s*\(\d+\)/)?.[1]?.trim() ?? null
}

async function fetchText(url, attempt = 0) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } catch (err) {
    if (attempt < RETRIES) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
      return fetchText(url, attempt + 1)
    }
    throw err
  }
}

async function parseSitemap() {
  console.log(`Fetching sitemap ${SITEMAP_URL}`)
  const xml = await fetchText(SITEMAP_URL)
  const stores = new Map() // dedupe by storeNumber
  for (const match of xml.matchAll(STORE_URL_RE)) {
    const [url, state, citySlug, storeNumber] = match
    stores.set(storeNumber, {
      storeNumber,
      state: state.toUpperCase(),
      citySlug,
      url: url.endsWith('/') ? url : url + '/',
    })
  }
  return Array.from(stores.values())
}

async function scrapeStorePage(store) {
  const html = await fetchText(store.url)
  const title = extractTitle(html)
  return {
    storeNumber: store.storeNumber,
    name: extractStoreName(title) ?? store.citySlug,
    streetAddress: extractMeta(html, 'business:contact_data:street_address'),
    city: extractMeta(html, 'business:contact_data:locality') ?? null,
    state: store.state,
    zip: extractZip(title),
    phone: extractMeta(html, 'business:contact_data:phone_number'),
    url: store.url,
  }
}

async function runWithConcurrency(items, limit, worker) {
  const results = []
  let cursor = 0
  let done = 0
  const workers = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      try {
        results[i] = await worker(items[i])
      } catch (err) {
        results[i] = { error: err.message, item: items[i] }
      }
      done++
      if (done % 50 === 0 || done === items.length) {
        process.stdout.write(`  ${done}/${items.length}\n`)
      }
    }
  })
  await Promise.all(workers)
  return results
}

async function main() {
  const stores = await parseSitemap()
  console.log(`Found ${stores.length} unique store URLs. Scraping pages...`)

  const scraped = await runWithConcurrency(stores, CONCURRENCY, scrapeStorePage)

  const ok = scraped.filter((s) => s && !s.error && s.streetAddress)
  const failed = scraped.filter((s) => !s || s.error || !s.streetAddress)

  // Sort by state then city for nicer diffs and a stable dropdown order.
  ok.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name))

  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(ok, null, 2) + '\n', 'utf8')

  console.log(`\nWrote ${ok.length} stores -> ${OUTPUT_PATH}`)
  if (failed.length) {
    console.log(`Skipped ${failed.length} stores with missing address/errors:`)
    for (const f of failed.slice(0, 5)) {
      console.log('  -', f.item?.url ?? f.error)
    }
    if (failed.length > 5) console.log(`  ...and ${failed.length - 5} more`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
