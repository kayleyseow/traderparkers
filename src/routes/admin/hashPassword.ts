/**
 * Client-side SHA-256 hashing for the admin password gate.
 *
 * This is intentionally weak by security standards — we ship a hash of a
 * passable password in the client bundle, and anyone determined to read it
 * can. The threat model is "Parker's nosy roommate clicks around in DevTools,"
 * not "real adversary." For that, hashing defeats inspect-element snooping
 * while keeping the auth flow simple and serverless.
 *
 * The same hash value is mirrored as the ADMIN_HASH secret on the Cloudflare
 * Worker — that's how the Worker verifies that a /pantry request actually
 * came from someone who knows the password.
 *
 * To change the password:
 *   1. Open the browser DevTools console on any page of this site.
 *   2. Paste this snippet, replacing YOUR_PASSWORD:
 *        await crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSWORD'))
 *          .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join(''))
 *   3. Copy the hex string it logs and paste it as PASSWORD_HASH below.
 *   4. Update the Worker secret too: `cd workers && npx wrangler secret put ADMIN_HASH`
 *   5. Commit the change.
 *
 * Current placeholder password: "tradertotes"
 * — change this before sharing the site with Parker!
 */
export const PASSWORD_HASH =
  'a4e3c7b0da7f9493bcc9fee87d2f99e3bd895a75f43298d2068ea0775ae22069'

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function checkPassword(input: string): Promise<boolean> {
  const hash = await sha256Hex(input)
  return hash === PASSWORD_HASH
}
