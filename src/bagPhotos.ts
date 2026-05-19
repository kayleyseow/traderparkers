/**
 * Shared helpers used by both /bags/:slug (Parker's photos) and
 * /encyclopedia/:id (reference photos) — angle types, filename-to-angle
 * inference, URL building, and the default-photos picker for variants.
 *
 * Per-bag design copy (subtitle, blurb, angleCaptions) now lives directly on
 * each entry in public/data/encyclopedia.json under the `design` field. The
 * old DESIGN_NOTES export was migrated out on 2026-05-18.
 */

const BASE = import.meta.env.BASE_URL

export type Angle = 'front' | 'back' | 'left' | 'right' | 'bottom'

export const ANGLE_ORDER: Angle[] = ['front', 'back', 'left', 'right', 'bottom']

export const ANGLE_LABEL: Record<Angle, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
  bottom: 'Bottom',
}

export function inferAngleMap(photos: string[]): Partial<Record<Angle, string>> {
  const result: Partial<Record<Angle, string>> = {}
  for (const p of photos) {
    const base = p
      .split('/')
      .pop()
      ?.replace(/\.[^./]+$/, '')
      .toLowerCase()
    if (!base) continue
    // Match exact angle name (front.png) or a color-prefixed form
    // (skyblue_front.png, navy_back.png) so we can keep multiple colorways
    // of the same bag side by side in one folder.
    const matched = (ANGLE_ORDER as readonly string[]).find(
      (a) => base === a || base.endsWith('_' + a),
    ) as Angle | undefined
    if (matched) {
      result[matched] = p
    }
  }
  return result
}

export function photoUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${BASE}${path.replace(/^\//, '')}`
}

/**
 * The default photo set for an encyclopedia entry. Entries with variants store
 * photos inside each variant; this falls through to the first variant when the
 * entry has no top-level photos of its own.
 */
export function defaultReferencePhotos(bag: {
  referencePhotos?: string[]
  referencePhoto?: string
  variants?: { referencePhotos?: string[]; colorways?: { photo: string }[] }[]
}): string[] {
  if (bag.referencePhotos?.length) return bag.referencePhotos
  const v0 = bag.variants?.[0]
  if (v0?.colorways?.length) return v0.colorways.map((c) => c.photo)
  if (v0?.referencePhotos?.length) return v0.referencePhotos
  if (bag.referencePhoto) return [bag.referencePhoto]
  return []
}
