import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BAG_FRAMES, frameImgStyle, type FrameDef } from './Pantry'
import { useTitle } from '../useTitle'

const BASE = import.meta.env.BASE_URL

// Reference photos with orientation labels — pick a horizontal one to tune
// landscape frames, a vertical one for portrait frames.
const REFERENCE_PHOTOS = [
  { name: 'citrus-jute (4:3 horizontal)', url: `${BASE}pantry-photos/citrus-jute-2026-02-17-e82c26.jpeg` },
  { name: 'classic-reusable (4:3 horizontal)', url: `${BASE}pantry-photos/classic-reusable-2026-05-17-0d2799.jpeg` },
  { name: 'arizona back (16:9 horizontal)', url: `${BASE}pantry-photos/az-2026-05-15-f8b96a.jpeg` },
  { name: 'arizona front (3:4 portrait)', url: `${BASE}pantry-photos/az-2026-05-15-f4ec9c.jpeg` },
  { name: 'kentucky (3:4 portrait)', url: `${BASE}pantry-photos/ky-2026-05-15-13166f.jpeg` },
  { name: 'flower-shop (4:5 portrait)', url: `${BASE}pantry-photos/flower-shop-2026-05-17-6f1a06.png` },
  { name: 'mock 9:16 portrait (very tall)', url: `${BASE}pantry-photos/mock-9x16-portrait.jpg` },
]

type Rotation = 0 | 90 | 180 | 270

function swapAspect(aspect: string): string {
  const [w, h] = aspect.split('/').map((s) => parseFloat(s.trim()))
  return `${h} / ${w}`
}

type Inset = FrameDef['inset']

function parsePct(s: string): number {
  return parseFloat(s.replace('%', '')) || 0
}
function toPct(n: number): string {
  return `${Math.round(n * 10) / 10}%`
}

export default function FrameTuner() {
  useTitle('Frame Tuner', undefined, true)
  const [frameFile, setFrameFile] = useState(BAG_FRAMES[0].file)
  const [photoUrl, setPhotoUrl] = useState(REFERENCE_PHOTOS[0].url)
  const [previewWidth, setPreviewWidth] = useState(380)

  const frame = useMemo(
    () => BAG_FRAMES.find((f) => f.file === frameFile) ?? BAG_FRAMES[0],
    [frameFile],
  )

  // Per-frame tuned values, seeded from BAG_FRAMES when frame changes.
  const [aspect, setAspect] = useState(frame.aspect)
  const [inset, setInset] = useState<Inset>(frame.inset)
  const [rotation, setRotation] = useState<Rotation>(frame.rotate ?? 0)
  const [photoZoom, setPhotoZoom] = useState(1)
  const [photoShiftY, setPhotoShiftY] = useState(0)
  const [frameShiftY, setFrameShiftY] = useState(0)
  const [frameScaleX, setFrameScaleX] = useState(1)
  const [frameScaleY, setFrameScaleY] = useState(1)
  const [squishY, setSquishY] = useState(1)

  // Reset tuning state to the frame's defaults when switching frames.
  const switchFrame = (file: string) => {
    setFrameFile(file)
    const next = BAG_FRAMES.find((f) => f.file === file) ?? BAG_FRAMES[0]
    setAspect(next.aspect)
    setInset(next.inset)
    setRotation(next.rotate ?? 0)
    setPhotoZoom(1)
    setPhotoShiftY(0)
    setFrameShiftY(0)
    setFrameScaleX(1)
    setFrameScaleY(1)
    setSquishY(1)
  }

  // Toggling rotation between portrait↔landscape auto-swaps the container's
  // aspect — going from 0 to 90 (or back) flips the container's W/H. Inset
  // values stay (user can re-tune); aspect swap is purely mechanical.
  const changeRotation = (next: Rotation) => {
    const wasOrthogonal = rotation === 90 || rotation === 270
    const willBeOrthogonal = next === 90 || next === 270
    if (wasOrthogonal !== willBeOrthogonal) setAspect(swapAspect(aspect))
    setRotation(next)
  }

  // Apply squishY to the displayed aspect just like the live system does.
  const displayedAspect = useMemo(() => {
    const [w, h] = aspect.split('/').map((s) => parseFloat(s.trim()))
    return `${w} / ${h * squishY}`
  }, [aspect, squishY])

  const photoStyle =
    photoZoom !== 1 || photoShiftY !== 0
      ? { transform: `translateY(${photoShiftY}%) scale(${photoZoom})` }
      : undefined

  // Frame style — handles rotation + optional shift + scale via the shared
  // helper so the tuner preview matches the live BagCard render exactly.
  const frameStyle = {
    position: 'absolute' as const,
    ...frameImgStyle(
      rotation,
      frameShiftY !== 0 ? `${frameShiftY}%` : undefined,
      frameScaleX,
      frameScaleY,
    ),
  }

  const codeSnippet = `{
  file: '${frame.file}',
  aspect: '${aspect}',${rotation !== 0 ? `\n  rotate: ${rotation},` : ''}
  inset: { top: '${inset.top}', right: '${inset.right}', bottom: '${inset.bottom}', left: '${inset.left}' },
},`

  const overrideSnippet = [
    photoZoom !== 1 && `photoZoom: ${photoZoom}`,
    photoShiftY !== 0 && `photoShiftY: '${photoShiftY}%'`,
    frameShiftY !== 0 && `frameShiftY: '${frameShiftY}%'`,
    frameScaleX !== 1 && `frameScaleX: ${frameScaleX}`,
    frameScaleY !== 1 && `frameScaleY: ${frameScaleY}`,
    squishY !== 1 && `squishY: ${squishY}`,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <main className="min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] p-6 md:p-10 font-[var(--tj-body)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
          <h1 className="text-3xl md:text-4xl text-[var(--tj-red)]" style={{ fontFamily: 'var(--tj-script)' }}>
            Frame Tuner
          </h1>
          <Link to="/pantry" className="text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline">
            ← Back to Pantry
          </Link>
        </div>

        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
          {/* LEFT — live preview */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
              <span className="opacity-60">Preview width</span>
              <input
                type="range"
                min={240}
                max={520}
                value={previewWidth}
                onChange={(e) => setPreviewWidth(parseInt(e.target.value))}
              />
              <span>{previewWidth}px</span>
            </div>

            <div
              className="relative overflow-hidden mx-auto bg-[var(--tj-cream-dark)]"
              style={{ aspectRatio: displayedAspect, width: previewWidth, containerType: 'size' }}
            >
              <div className="absolute overflow-hidden bg-[var(--tj-kraft)]/20" style={inset}>
                <img
                  src={photoUrl}
                  alt=""
                  className="w-full h-full object-contain p-1"
                  style={photoStyle}
                />
              </div>
              <img
                src={`${BASE}decor/frames/${frame.file}`}
                alt=""
                aria-hidden
                className="pointer-events-none select-none"
                style={frameStyle}
              />
            </div>

            <p className="mt-3 text-xs opacity-60 text-center">
              Frame: {frame.file} · default aspect {frame.aspect}
              {rotation !== 0 && ` · rotated ${rotation}°`}
            </p>
          </div>

          {/* RIGHT — controls */}
          <div className="space-y-6">
            <div className="flex gap-4 flex-wrap">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] flex-1 min-w-[200px]">
                <span className="opacity-60">Frame</span>
                <select
                  value={frameFile}
                  onChange={(e) => switchFrame(e.target.value)}
                  className="border-2 border-[var(--tj-ink)] bg-white px-2 py-1.5 text-sm tracking-normal normal-case"
                >
                  {BAG_FRAMES.map((f) => (
                    <option key={f.file} value={f.file}>
                      {f.file}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] flex-1 min-w-[200px]">
                <span className="opacity-60">Reference photo</span>
                <select
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="border-2 border-[var(--tj-ink)] bg-white px-2 py-1.5 text-sm tracking-normal normal-case"
                >
                  {REFERENCE_PHOTOS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] flex-1 min-w-[160px]">
                <span className="opacity-60">Rotate frame</span>
                <select
                  value={rotation}
                  onChange={(e) => changeRotation(parseInt(e.target.value) as Rotation)}
                  className="border-2 border-[var(--tj-ink)] bg-white px-2 py-1.5 text-sm tracking-normal normal-case"
                >
                  <option value={0}>None (0°)</option>
                  <option value={90}>90° clockwise</option>
                  <option value={180}>180° (flip)</option>
                  <option value={270}>90° counter-clockwise</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] flex-1 min-w-[140px]">
                <span className="opacity-60">Container aspect</span>
                <input
                  type="text"
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value)}
                  placeholder="e.g. 4 / 3"
                  className="border-2 border-[var(--tj-ink)] bg-white px-2 py-1.5 text-sm tracking-normal normal-case font-mono"
                />
              </label>
            </div>

            <fieldset className="border border-[var(--tj-ink)]/30 p-4">
              <legend className="text-xs uppercase tracking-[0.2em] px-2 opacity-80">Inset (% of container)</legend>
              <PctSlider label="Top" value={parsePct(inset.top)} onChange={(v) => setInset({ ...inset, top: toPct(v) })} />
              <PctSlider label="Right" value={parsePct(inset.right)} onChange={(v) => setInset({ ...inset, right: toPct(v) })} />
              <PctSlider label="Bottom" value={parsePct(inset.bottom)} onChange={(v) => setInset({ ...inset, bottom: toPct(v) })} />
              <PctSlider label="Left" value={parsePct(inset.left)} onChange={(v) => setInset({ ...inset, left: toPct(v) })} />
            </fieldset>

            <fieldset className="border border-[var(--tj-ink)]/30 p-4">
              <legend className="text-xs uppercase tracking-[0.2em] px-2 opacity-80">Per-bag overrides (optional)</legend>
              <NumSlider label="Photo zoom" value={photoZoom} onChange={setPhotoZoom} min={0.5} max={2.5} step={0.05} format={(v) => `${v.toFixed(2)}×`} />
              <NumSlider label="Photo shiftY" value={photoShiftY} onChange={setPhotoShiftY} min={-50} max={50} step={1} format={(v) => `${v}%`} />
              <NumSlider label="Frame shiftY" value={frameShiftY} onChange={setFrameShiftY} min={-50} max={50} step={1} format={(v) => `${v}%`} />
              <NumSlider label="Frame scaleX" value={frameScaleX} onChange={setFrameScaleX} min={0.5} max={1.5} step={0.01} format={(v) => `${v.toFixed(2)}×`} />
              <NumSlider label="Frame scaleY" value={frameScaleY} onChange={setFrameScaleY} min={0.5} max={1.5} step={0.01} format={(v) => `${v.toFixed(2)}×`} />
              <NumSlider label="Squish Y (card)" value={squishY} onChange={setSquishY} min={0.5} max={1.5} step={0.01} format={(v) => `${v.toFixed(2)}×`} />
            </fieldset>

            <div className="border border-[var(--tj-ink)]/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">Paste into BAG_FRAMES</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(codeSnippet)}
                  className="text-[0.65rem] uppercase tracking-[0.2em] border border-[var(--tj-ink)] px-2 py-1 hover:bg-[var(--tj-ink)] hover:text-[var(--tj-cream)] transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="text-xs overflow-x-auto bg-[var(--tj-cream-dark)] p-3 leading-relaxed whitespace-pre">{codeSnippet}</pre>

              {overrideSnippet && (
                <>
                  <p className="text-xs uppercase tracking-[0.2em] opacity-80 mt-4 mb-2">For a single bag (BAG_OVERRIDES)</p>
                  <pre className="text-xs overflow-x-auto bg-[var(--tj-cream-dark)] p-3 leading-relaxed whitespace-pre">{`'<slug>': { ${overrideSnippet} },`}</pre>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function PctSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="w-20 text-xs uppercase tracking-[0.18em] opacity-70">{label}</span>
      <input
        type="range"
        min={0}
        max={50}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
      />
      <input
        type="number"
        min={0}
        max={50}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-16 border border-[var(--tj-ink)] px-2 py-0.5 text-xs text-right"
      />
      <span className="text-xs opacity-50 w-3">%</span>
    </div>
  )
}

function NumSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="w-28 text-xs uppercase tracking-[0.18em] opacity-70">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
      />
      <span className="text-xs w-16 text-right tabular-nums">{format(value)}</span>
    </div>
  )
}
