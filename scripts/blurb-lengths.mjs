import { readFileSync } from 'node:fs'

const ts = readFileSync('src/bagPhotos.ts', 'utf8')
const re = /^\s+'?([a-z0-9_-]+)'?:\s*\{\s*\n\s+subtitle:\s+'([^']*)',\s*\n\s+blurb:\s*\n\s+'((?:[^'\\]|\\.)*)'/gm

const entries = []
let m
while ((m = re.exec(ts)) !== null) {
  const [, id, , blurb] = m
  const clean = blurb.replace(/\\'/g, "'")
  entries.push({ id, chars: clean.length, words: clean.trim().split(/\s+/).length })
}

entries.sort((a, b) => b.chars - a.chars)
console.log('blurbs found:', entries.length, '\n')
console.log('LONGEST 10:')
entries
  .slice(0, 10)
  .forEach((e) =>
    console.log(
      '  ' +
        e.chars.toString().padStart(5) +
        ' chars  ' +
        e.words.toString().padStart(3) +
        ' words  ' +
        e.id,
    ),
  )
console.log('\nSHORTEST 10:')
entries
  .slice(-10)
  .forEach((e) =>
    console.log(
      '  ' +
        e.chars.toString().padStart(5) +
        ' chars  ' +
        e.words.toString().padStart(3) +
        ' words  ' +
        e.id,
    ),
  )

const sorted = [...entries].sort((a, b) => a.chars - b.chars)
const sum = entries.reduce((a, b) => a + b.chars, 0)
const med = sorted[Math.floor(sorted.length / 2)].chars
const p25 = sorted[Math.floor(sorted.length * 0.25)].chars
const p75 = sorted[Math.floor(sorted.length * 0.75)].chars
console.log('\navg:', Math.round(sum / entries.length), 'chars')
console.log('p25:', p25, ' med:', med, ' p75:', p75, ' max:', entries[0].chars)
