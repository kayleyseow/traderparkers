/**
 * Pre-renders static HTML files for every encyclopedia route so GitHub Pages
 * can serve them with a 200 status (instead of the 404-status SPA fallback).
 *
 * Reads `dist/index.html` (the post-build Vite template — already has the
 * right asset bundle refs), and for each route writes a copy to
 * `dist/<route>/index.html` with per-page title, description, canonical, OG
 * meta, and JSON-LD baked in. The runtime `useTitle` hook re-applies the same
 * values, so this layer is purely for crawlers and link-unfurl bots.
 *
 * Run AFTER `vite build`:
 *   npm run build && node scripts/prerender.mjs
 */

import fs from 'node:fs'
import path from 'node:path'

const SITE_ORIGIN = 'https://kayleyseow.github.io/tjbags'
const BRAND = "Trader Parker's"
const DIST = 'dist'
const TEMPLATE_PATH = path.join(DIST, 'index.html')
const ENCYCLOPEDIA_PATH = 'public/data/encyclopedia.json'

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`Template not found at ${TEMPLATE_PATH}. Run \`npm run build\` first.`)
  process.exit(1)
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
const enc = JSON.parse(fs.readFileSync(ENCYCLOPEDIA_PATH, 'utf8'))

// ── Generate the encyclopedia index page ──────────────────────────────────
writeRoute('encyclopedia', {
  title: 'Encyclopedia',
  description:
    "Every known Trader Joe's reusable tote — state-themed, special editions, and the standard lineup, with photos and design notes for each.",
  canonical: `${SITE_ORIGIN}/encyclopedia`,
  og: {
    title: `Encyclopedia · ${BRAND} Bag Bazaar`,
    description:
      "Every known Trader Joe's reusable tote — state, special, and standard designs.",
    url: `${SITE_ORIGIN}/encyclopedia`,
  },
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${BRAND} Bag Bazaar — Encyclopedia`,
    description:
      "Every known Trader Joe's reusable tote — state, special, and standard designs.",
    url: `${SITE_ORIGIN}/encyclopedia`,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
  },
})

// ── Generate one HTML file per bag detail page ────────────────────────────
let bagCount = 0
for (const entry of enc) {
  const displayName = entry.region ?? entry.name
  const description = entry.description ?? truncateForMeta(entry.design?.blurb)
  const firstPhoto = entry.referencePhotos?.[0]
  const ogImage = firstPhoto ? `${SITE_ORIGIN}/${firstPhoto}` : undefined
  const allImages = entry.referencePhotos?.map((p) => `${SITE_ORIGIN}/${p}`)

  writeRoute(`encyclopedia/${entry.id}`, {
    title: displayName,
    description,
    canonical: `${SITE_ORIGIN}/encyclopedia/${entry.id}`,
    og: {
      title: `${displayName} · ${BRAND}`,
      description,
      url: `${SITE_ORIGIN}/encyclopedia/${entry.id}`,
      image: ogImage,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: displayName,
      description,
      image: allImages,
      brand: { '@type': 'Brand', name: "Trader Joe's" },
      category: 'Reusable shopping bag',
    },
  })
  bagCount++
}

console.log(`Prerendered: 1 encyclopedia index + ${bagCount} bag detail pages`)

/* ───────────────────────────── HELPERS ───────────────────────────── */

function writeRoute(routePath, meta) {
  let html = template

  // Title — index.html ships with `<title>Trader Parker's Bag Bazaar</title>`
  const fullTitle = meta.title ? `${meta.title} · ${BRAND}` : `${BRAND} Bag Bazaar`
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeText(fullTitle)}</title>`)

  // Meta description
  if (meta.description) {
    html = upsertMeta(html, 'name', 'description', meta.description)
  }

  // Canonical link
  if (meta.canonical) {
    html = upsertLink(html, 'canonical', meta.canonical)
  }

  // Open Graph + Twitter
  if (meta.og) {
    if (meta.og.title) {
      html = upsertMeta(html, 'property', 'og:title', meta.og.title)
      html = upsertMeta(html, 'name', 'twitter:title', meta.og.title)
    }
    if (meta.og.description) {
      html = upsertMeta(html, 'property', 'og:description', meta.og.description)
      html = upsertMeta(html, 'name', 'twitter:description', meta.og.description)
    }
    if (meta.og.url) {
      html = upsertMeta(html, 'property', 'og:url', meta.og.url)
    }
    if (meta.og.image) {
      html = upsertMeta(html, 'property', 'og:image', meta.og.image)
      html = upsertMeta(html, 'name', 'twitter:image', meta.og.image)
      // Promote the static `summary` card to `summary_large_image` so platforms
      // render the photo full-width.
      html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image')
    }
  }

  // Per-page JSON-LD — injected right before </head>, alongside (not replacing)
  // the static WebSite block in index.html.
  if (meta.jsonLd) {
    const jsonText = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')
    const script = `    <script type="application/ld+json" data-page-jsonld>${jsonText}</script>\n  `
    html = html.replace('</head>', `${script}</head>`)
  }

  const outDir = path.join(DIST, routePath)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), html)
}

/**
 * Replace the `content` attribute of a meta tag matching the given key, or
 * insert a new tag right before </head> if none exists.
 */
function upsertMeta(html, keyAttr, keyValue, content) {
  const escaped = escapeAttr(content)
  // Match either order: name="x" content="y" OR content="y" name="x"
  const tagRe = new RegExp(
    `<meta\\s+(?:[^>]*?\\s)?${keyAttr}="${escapeRegex(keyValue)}"[^>]*>`,
    'i',
  )
  if (tagRe.test(html)) {
    return html.replace(tagRe, (match) => {
      // Replace just the content="..." within the matched tag.
      if (/content="/.test(match)) {
        return match.replace(/content="[^"]*"/, `content="${escaped}"`)
      }
      // No content attribute — append one.
      return match.replace(/\s*\/?>$/, ` content="${escaped}" />`)
    })
  }
  const insert = `    <meta ${keyAttr}="${keyValue}" content="${escaped}" />\n  `
  return html.replace('</head>', `${insert}</head>`)
}

function upsertLink(html, rel, href) {
  const escaped = escapeAttr(href)
  const tagRe = new RegExp(`<link\\s+(?:[^>]*?\\s)?rel="${escapeRegex(rel)}"[^>]*>`, 'i')
  if (tagRe.test(html)) {
    return html.replace(tagRe, (match) => {
      if (/href="/.test(match)) {
        return match.replace(/href="[^"]*"/, `href="${escaped}"`)
      }
      return match.replace(/\s*\/?>$/, ` href="${escaped}" />`)
    })
  }
  const insert = `    <link rel="${rel}" href="${escaped}" />\n  `
  return html.replace('</head>', `${insert}</head>`)
}

function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Mirror of the same helper in src/routes/EncyclopediaDetail.tsx. */
function truncateForMeta(s, max = 155) {
  if (!s) return undefined
  const trimmed = s.trim()
  if (trimmed.length <= max) return trimmed
  return trimmed.slice(0, max).replace(/\s+\S*$/, '').trim() + '…'
}
