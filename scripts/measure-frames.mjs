import sharp from 'sharp'
import { readdir } from 'node:fs/promises'

const FRAMES_DIR = 'public/decor/frames'
const ALPHA_THRESHOLD = 32

async function analyze(file) {
  const path = `${FRAMES_DIR}/${file}`
  const { data, info } = await sharp(path, { density: 100 })
    .resize({ width: 800 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const W = info.width
  const H = info.height
  const C = info.channels
  const op = (x, y) => data[(y * W + x) * C + 3] > ALPHA_THRESHOLD

  // 1) Bounding box of opaque pixels (the actual artwork extent)
  let minX = W, minY = H, maxX = -1, maxY = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (op(x, y)) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null

  // 2) Walk from center outward to find the transparent "hole"
  const cx = Math.floor(W / 2)
  const cy = Math.floor(H / 2)
  if (op(cx, cy)) {
    // Center isn't transparent. Frame has something in the middle. Skip insets.
    return { file, vbPad: viewBoxPadding(minX, minY, maxX, maxY, W, H), hole: null }
  }
  let lx = cx, rx = cx, ty = cy, by = cy
  while (lx > 0 && !op(lx, cy)) lx--
  while (rx < W - 1 && !op(rx, cy)) rx++
  while (ty > 0 && !op(cx, ty)) ty--
  while (by < H - 1 && !op(cx, by)) by++

  return {
    file,
    vbPad: viewBoxPadding(minX, minY, maxX, maxY, W, H),
    hole: {
      top: pct(ty / H),
      right: pct((W - rx) / W),
      bottom: pct((H - by) / H),
      left: pct(lx / W),
    },
  }
}

function viewBoxPadding(minX, minY, maxX, maxY, W, H) {
  return {
    top: pct(minY / H),
    right: pct((W - maxX) / W),
    bottom: pct((H - maxY) / H),
    left: pct(minX / W),
  }
}

function pct(v) {
  return (v * 100).toFixed(1) + '%'
}

const files = (await readdir(FRAMES_DIR)).filter((f) => f.endsWith('.svg')).sort()
console.log('\nFrame\t\t\tviewBox padding (T R B L)\t→ measured photo inset (T R B L)\n')
for (const f of files) {
  const r = await analyze(f)
  const pad = r?.vbPad ?? {}
  const ins = r?.hole ?? {}
  const padStr = `${pad.top} ${pad.right} ${pad.bottom} ${pad.left}`
  const insStr = ins.top
    ? `${ins.top} ${ins.right} ${ins.bottom} ${ins.left}`
    : '(no clear hole)'
  console.log(`${f.padEnd(28)} ${padStr.padEnd(28)} → ${insStr}`)
}
