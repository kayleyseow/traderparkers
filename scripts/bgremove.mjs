#!/usr/bin/env node
/**
 * Runs @imgly background removal + crop on every image in a folder.
 * Mirrors the Finalize step inside pick-photos.mjs.
 *
 * Usage:
 *   node scripts/bgremove.mjs <inDir> <outDir>
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve, extname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const CROP_PADDING = 0.04
const CROP_ASPECT_RATIO = 4 / 5

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

async function cropToSubject(sharp, pngBuffer) {
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

  return await sharp(trimmedBuf)
    .extend({
      top: Math.floor(padH / 2),
      bottom: Math.ceil(padH / 2),
      left: Math.floor(padW / 2),
      right: Math.ceil(padW / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

async function main() {
  const [inDir, outDir] = process.argv.slice(2)
  if (!inDir || !outDir) {
    console.log('Usage: node scripts/bgremove.mjs <inDir> <outDir>')
    process.exit(1)
  }

  const { removeBackground } = await import('@imgly/background-removal-node')
  const nestedSharp = resolve(
    ROOT,
    'node_modules/@imgly/background-removal-node/node_modules/sharp/lib/index.js',
  )
  const sharp = (await import(pathToFileURL(nestedSharp).href)).default

  await mkdir(outDir, { recursive: true })
  const files = (await readdir(inDir)).filter((f) =>
    Object.keys(MIME).includes(extname(f).toLowerCase()),
  )
  if (files.length === 0) {
    console.log(`No images found in ${inDir}`)
    return
  }

  for (const file of files) {
    const srcPath = resolve(inDir, file)
    const outPath = resolve(outDir, `${basename(file, extname(file))}.png`)
    const mime = MIME[extname(file).toLowerCase()] ?? 'image/png'
    try {
      const inputBuf = await readFile(srcPath)
      const inputBlob = new Blob([inputBuf], { type: mime })
      const outBlob = await removeBackground(inputBlob, {
        output: { format: 'image/png' },
      })
      const rawBuf = Buffer.from(await outBlob.arrayBuffer())
      const croppedBuf = await cropToSubject(sharp, rawBuf)
      await writeFile(outPath, croppedBuf)
      console.log(`  ✓ ${file} → ${basename(outPath)}`)
    } catch (err) {
      console.log(`  ✗ ${file} — ${err.message}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
