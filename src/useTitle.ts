import { useEffect } from 'react'

const BRAND = "Trader Parker's"

export type PageMeta = {
  title: string
  description?: string
  noindex?: boolean
  /** Absolute URL the search engine should treat as canonical for this page. */
  canonical?: string
  /** Per-page Open Graph / Twitter card overrides. */
  og?: {
    title?: string
    description?: string
    url?: string
    image?: string
  }
  /** Structured data object — serialized into a <script type=application/ld+json> tag. */
  jsonLd?: object
}

/**
 * Manages document.title, meta description, noindex, canonical link, OG/Twitter
 * meta, and JSON-LD structured data while the calling component is mounted.
 * Restores the previous head state on unmount.
 *
 * Accepts either positional args (legacy) or an options object (preferred for
 * the encyclopedia routes that need full SEO control).
 */
export function useTitle(
  arg: string | PageMeta,
  description?: string,
  noindex?: boolean,
) {
  const meta: PageMeta =
    typeof arg === 'string' ? { title: arg, description, noindex } : arg

  // Stable dep key so the effect doesn't refire when callers pass fresh object
  // literals every render. JSON.stringify is fine for meta-sized payloads.
  const depKey = JSON.stringify(meta)

  useEffect(() => {
    const cleanups: Array<() => void> = []

    // ── Title ────────────────────────────────────────────────────────────
    const prevTitle = document.title
    document.title = meta.title ? `${meta.title} · ${BRAND}` : `${BRAND} Bag Bazaar`
    cleanups.push(() => {
      document.title = prevTitle
    })

    // ── Meta description ─────────────────────────────────────────────────
    if (meta.description) {
      cleanups.push(setMetaContent('name', 'description', meta.description))
    }

    // ── Noindex ──────────────────────────────────────────────────────────
    if (meta.noindex) {
      const tag = document.createElement('meta')
      tag.setAttribute('name', 'robots')
      tag.setAttribute('content', 'noindex')
      document.head.appendChild(tag)
      cleanups.push(() => tag.remove())
    }

    // ── Canonical ────────────────────────────────────────────────────────
    if (meta.canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      let createdLink = false
      let prevHref: string | null = null
      if (link) {
        prevHref = link.getAttribute('href')
      } else {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
        createdLink = true
      }
      link.setAttribute('href', meta.canonical)
      cleanups.push(() => {
        if (createdLink) {
          link!.remove()
        } else if (prevHref !== null) {
          link!.setAttribute('href', prevHref)
        }
      })
    }

    // ── Open Graph + Twitter ─────────────────────────────────────────────
    if (meta.og) {
      const og = meta.og
      const tw = {
        title: og.title,
        description: og.description,
        image: og.image,
      }
      if (og.title) {
        cleanups.push(setMetaContent('property', 'og:title', og.title))
        cleanups.push(setMetaContent('name', 'twitter:title', og.title))
      }
      if (og.description) {
        cleanups.push(setMetaContent('property', 'og:description', og.description))
        cleanups.push(setMetaContent('name', 'twitter:description', og.description))
      }
      if (og.url) {
        cleanups.push(setMetaContent('property', 'og:url', og.url))
      }
      if (og.image) {
        cleanups.push(setMetaContent('property', 'og:image', og.image))
        cleanups.push(setMetaContent('name', 'twitter:image', og.image))
        // If we have a real image, upgrade the twitter card so platforms render it large.
        cleanups.push(setMetaContent('name', 'twitter:card', 'summary_large_image'))
      }
      void tw // referenced for symmetry; actual writes above
    }

    // ── JSON-LD structured data ──────────────────────────────────────────
    if (meta.jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      // data-page-jsonld lets future code identify these without colliding
      // with the static WebSite block in index.html.
      script.setAttribute('data-page-jsonld', '')
      script.textContent = JSON.stringify(meta.jsonLd)
      document.head.appendChild(script)
      cleanups.push(() => script.remove())
    }

    return () => {
      for (const fn of cleanups) fn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey])
}

/**
 * Set a meta tag's content attribute, creating the tag if it doesn't exist.
 * Returns a cleanup that restores the previous value (or removes the tag
 * entirely if we created it).
 */
function setMetaContent(
  keyAttr: 'name' | 'property',
  keyValue: string,
  newContent: string,
): () => void {
  const selector = `meta[${keyAttr}="${keyValue}"]`
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  let created = false
  let prevContent: string | null = null
  if (tag) {
    prevContent = tag.getAttribute('content')
  } else {
    tag = document.createElement('meta')
    tag.setAttribute(keyAttr, keyValue)
    document.head.appendChild(tag)
    created = true
  }
  tag.setAttribute('content', newContent)
  return () => {
    if (created) {
      tag!.remove()
    } else if (prevContent !== null) {
      tag!.setAttribute('content', prevContent)
    }
  }
}
