#!/usr/bin/env node
/**
 * Fetches the og:image PNG from a Trader Joe's PDP URL.
 * The CDN requires a Referer header pointing at the PDP page itself.
 *
 * Usage:
 *   node scripts/scrape-tj-pdp.mjs <outDir> <slug>=<pdpUrl> [<slug>=<pdpUrl> ...]
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const COMMON_HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Upgrade-Insecure-Requests': '1',
}

async function fetchPdpImageUrl(pdpUrl) {
  const res = await fetch(pdpUrl, { headers: COMMON_HEADERS })
  if (!res.ok) throw new Error(`PDP HTTP ${res.status}`)
  const html = await res.text()
  const m = html.match(/<meta property="og:image" content="([^"]+)"/)
  if (!m) throw new Error('og:image not found')
  return m[1]
}

async function fetchImage(imgUrl, pdpUrl) {
  const res = await fetch(imgUrl, {
    headers: {
      ...COMMON_HEADERS,
      Accept: 'image/avif,image/webp,image/png,image/*,*/*;q=0.8',
      Referer: pdpUrl,
    },
  })
  if (!res.ok) throw new Error(`IMG HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const [outDir, ...pairs] = process.argv.slice(2)
  if (!outDir || pairs.length === 0) {
    console.log('Usage: node scripts/scrape-tj-pdp.mjs <outDir> <slug>=<pdpUrl> ...')
    process.exit(1)
  }
  await mkdir(outDir, { recursive: true })

  for (const pair of pairs) {
    const idx = pair.indexOf('=')
    const slug = pair.slice(0, idx)
    const pdpUrl = pair.slice(idx + 1)
    try {
      const imgUrl = await fetchPdpImageUrl(pdpUrl)
      const buf = await fetchImage(imgUrl, pdpUrl)
      const out = resolve(outDir, `${slug}.png`)
      await writeFile(out, buf)
      console.log(`  ${slug}: ${(buf.length / 1024).toFixed(0)} KB  ←  ${imgUrl}`)
    } catch (err) {
      console.log(`  ${slug}: FAILED — ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, 600))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
