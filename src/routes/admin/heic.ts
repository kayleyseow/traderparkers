/* HEIC → JPEG normalization for admin photo uploads. iPhones serve `.heic`
   files that Chrome and Firefox can't render in <img>; we transcode them in
   the browser so the worker and the public site only ever see JPEGs.

   The `heic-to` lib carries a ~360KB libheif WASM payload, so the import is
   lazy — it never loads on the public bundle, only on the admin route, and
   only the first time a HEIC is actually picked. */

export function looksLikeHeic(file: File): boolean {
  if (/heic|heif/i.test(file.type)) return true
  // On Chrome/Windows iPhones often hand back `file.type === ''`, so the
  // filename extension is the only reliable hint at the pre-load stage.
  return /\.(heic|heif)$/i.test(file.name)
}

export async function normalizeImageFile(file: File): Promise<File> {
  if (!looksLikeHeic(file)) return file
  const { heicTo } = await import('heic-to')
  const jpegBlob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 })
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  return new File([jpegBlob], newName, { type: 'image/jpeg' })
}
