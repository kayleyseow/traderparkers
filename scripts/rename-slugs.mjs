import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const RENAMES = {
  'reusable-breakfast-tote': 'reusable-breakfast',
  'coffee-jute-bag': 'coffee-jute',
  'citrus-jute-bag': 'citrus-jute',
  'jute-bag': 'jute',
  'vegetable-jute-bag': 'vegetable-jute',
  'stock-keeping-unit-bag': 'stock-keeping-unit',
  'pickle-cotton-bag': 'pickle-cotton',
  'sardine-bag': 'sardine',
  'recycled-ocean-plastic-bag': 'recycled-ocean-plastic',
  'comfort-food-bag': 'comfort-food',
  'fearless-flyer-tote': 'fearless-flyer',
  'chicken-citrus-tote': 'chicken-citrus',
  'heritage-tote': 'heritage',
  'vintage-lady-tote': 'vintage-lady',
  'vintage-produce-tote': 'vintage-produce',
  'corn-can-tote': 'corn-can',
  'surfboard-tote': 'surfboard',
  '50th-anniversary-tote': '50th-anniversary',
  'flower-shop-tote': 'flower-shop',
  'vintage-destination-bag': 'vintage-destination',
  'victorian-kitchen-tote': 'victorian-kitchen',
  'vintage-print-bag': 'vintage-print',
  'new-recruit-tote': 'new-recruit',
  'moon-bag': 'moon',
  'classic-reusable-tote': 'classic-reusable',
  'insulated-reusable-bag': 'insulated-reusable',
  'large-insulated-bag': 'large-insulated',
  'mini-insulated-tote': 'mini-insulated',
  'mini-canvas-tote': 'mini-canvas',
  'canvas-micro-tote': 'canvas-micro',
  'bottle-holder-bag': 'bottle-holder',
  'reusable-flower-bag': 'vintage-hibiscus',
  'reusable-flower': 'vintage-hibiscus',
}

function renamePathSegment(path) {
  if (!path) return path
  return path
    .split('/')
    .map((seg) => RENAMES[seg] ?? seg)
    .join('/')
}

// --- 1. encyclopedia.json ---
const encPath = 'public/data/encyclopedia.json'
const enc = JSON.parse(readFileSync(encPath, 'utf8'))
let encChanges = 0
for (const bag of enc) {
  if (RENAMES[bag.id]) {
    bag.id = RENAMES[bag.id]
    encChanges++
  }
  if (Array.isArray(bag.referencePhotos)) {
    bag.referencePhotos = bag.referencePhotos.map(renamePathSegment)
  }
  if (Array.isArray(bag.variants)) {
    for (const v of bag.variants) {
      if (Array.isArray(v.referencePhotos)) {
        v.referencePhotos = v.referencePhotos.map(renamePathSegment)
      }
      if (Array.isArray(v.colorways)) {
        for (const cw of v.colorways) {
          if (cw.photo) cw.photo = renamePathSegment(cw.photo)
        }
      }
    }
  }
}
writeFileSync(encPath, JSON.stringify(enc, null, 2) + '\n')
console.log(`encyclopedia.json: ${encChanges} ids renamed, paths rewritten`)

// --- 2. pantry.json ---
const pantryPath = 'public/data/pantry.json'
const pantry = JSON.parse(readFileSync(pantryPath, 'utf8'))
let pantryChanges = 0
for (const p of pantry) {
  if (p.encyclopediaId && RENAMES[p.encyclopediaId]) {
    p.encyclopediaId = RENAMES[p.encyclopediaId]
    pantryChanges++
  }
}
writeFileSync(pantryPath, JSON.stringify(pantry, null, 2) + '\n')
console.log(`pantry.json: ${pantryChanges} encyclopediaIds updated`)

// --- 3. Move folders on disk ---
const FOLDER_PARENTS = [
  'public/bags/special-bags',
  'public/bags/canvas-bags',
  'public/bags/jute-bags',
  'public/bags/standard-bags',
]
let folderMoves = 0
for (const parent of FOLDER_PARENTS) {
  for (const [oldId, newId] of Object.entries(RENAMES)) {
    const oldDir = `${parent}/${oldId}`
    const newDir = `${parent}/${newId}`
    if (existsSync(oldDir)) {
      if (existsSync(newDir)) {
        console.warn(`SKIP folder rename — target exists: ${newDir}`)
        continue
      }
      renameSync(oldDir, newDir)
      folderMoves++
      console.log(`  ${oldDir} -> ${newDir}`)
    }
  }
}
console.log(`folders moved: ${folderMoves}`)

// --- 4. bagPhotos.ts DESIGN_NOTES keys ---
const bagPhotosPath = 'src/bagPhotos.ts'
let src = readFileSync(bagPhotosPath, 'utf8')
let keyChanges = 0
for (const [oldId, newId] of Object.entries(RENAMES)) {
  // Match: optional indent + quoted key. Be specific to keys-with-hyphens style.
  const re = new RegExp(`'${oldId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}'\\s*:`, 'g')
  const before = src
  src = src.replace(re, `'${newId}':`)
  if (src !== before) keyChanges++
}
writeFileSync(bagPhotosPath, src)
console.log(`bagPhotos.ts: ${keyChanges} DESIGN_NOTES keys renamed`)

console.log('\nDone.')
