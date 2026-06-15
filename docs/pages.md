# Trader Parker's Bag Bazaar — Pages

A visual tour of every page on Trader Parker's Bag Bazaar, including the admin views that are hidden behind a password.

---

## Public

### Landing: `/`

The front door, modeled after a Trader Joe's [paper grocery bag](https://us.amazon.com/Trader-Joes-Washable-Grocery-Reusable/dp/B08QXBB4VQ): kraft texture, red stamp, the works. The kraft feel comes from an SVG turbulence filter layered behind the cream background, giving the page a subtly crumpled-paper texture that quietly reappears on the Pantry to hold the aesthetic together. Birthday greeting, animated confetti, and the entry points into the catalog and Parker's collection.

> A small confession: after enough Trader Joe's runs, those same paper bags end up moonlighting as my most reliable temporary trash bins. Annoyingly dependable, in fact.

![Landing page](screenshots/landing.png)

### Encyclopedia: `/encyclopedia` (gallery view)

The default Encyclopedia view, and the reference half of the site: a US-state grid plus thematic sections for Special Editions and Standard Bags. Within Special Editions, bags sub-group by material (cotton, jute, insulated) with Victorian-figure spot illustrations marking the divides, a small decor touch from [The Graphics Fairy](https://thegraphicsfairy.com/) that quietly reinforces the engraved-encyclopedia feel.

![Encyclopedia gallery view](screenshots/encyclopedia-gallery.png)

The Standard Bags section is where the variant system shows up at the listing level: bags that share a shape but differ in print or color (the mini canvas tote's Classic/Halloween/Pastel, for example) get a single tile in the grid with a row of color chips beneath, rather than three near-duplicate entries.

![Encyclopedia gallery, Standard Bags with variant chips](screenshots/encyclopedia-standard-variants.png)

### Encyclopedia: `/encyclopedia` (dictionary view)

A compact, dictionary-style listing of every entry. Because the catalog is sorted A-to-Z, an alphabet scrubber is pinned to the right rail so you can jump straight to any letter without scrolling. Vintage margin illustrations sit between letter blocks.

![Encyclopedia dictionary view](screenshots/encyclopedia-dictionary.png)

### Suggest a Bag: bottom of `/encyclopedia`

A public-facing form sitting at the bottom of the Encyclopedia that lets anyone (not just Parker) submit a candidate bag for the catalog. It's the open mirror of the admin Log-a-Bag picker, gated by Cloudflare Turnstile to keep spam out. Submissions are routed through the same Worker that handles Parker's admin writes, but they land as GitHub issues for her to review and merge by hand, so the catalog stays curated even while staying open to the public.

<p align="center"><img src="screenshots/encyclopedia-suggest.png" alt="Encyclopedia: Suggest a Bag form" width="75%" /></p>

### Encyclopedia detail: `/encyclopedia/:id`

A single bag's catalog page: every angle photo, variants, materials, year coverage, and a quiet "Parker owns this" footer when applicable.

<p align="center"><img src="screenshots/encyclopedia-detail.png" alt="Encyclopedia detail page" width="75%" /></p>

On entries that ship in multiple prints or colors, a row of variant chips appears under the title so the visitor can switch between them without leaving the page. This is the catalog-side of the same one-entry-per-design rule from the gallery view.

![Encyclopedia detail, variant chips](screenshots/encyclopedia-detail-variants.png)

Two concrete examples of detail pages, a state bag (California subvariant) and a standard bag:

<table>
  <tr>
    <td valign="top" width="50%"><img src="screenshots/encyclopedia-northern-california.png" alt="Northern California bag detail page" width="100%" /></td>
    <td valign="top" width="50%"><img src="screenshots/encyclopedia-canvas-tote.png" alt="Canvas Tote bag detail page" width="100%" /></td>
  </tr>
  <tr>
    <td valign="top" width="50%" align="center"><em>Northern California</em></td>
    <td valign="top" width="50%" align="center"><em>Canvas Tote</em></td>
  </tr>
</table>

### Pantry: `/pantry`

Parker's Collection, every bag she's logged, in a vintage-frame gallery. Progress bars at the top track how much of each visible category she's collected, easing from 0% to their target value on mount so each visit feels like an arrival.

Two visual systems carry the page. Each photo is mounted inside one of ~18 vintage frames, auto-picked by aspect ratio so landscape photos land on landscape frames and portraits land on portraits. Beneath each frame sits a navy nameplate plaque (a cream-cartouche title bar over a navy body, holding the date, store chip, and Parker's memory blockquote) for an overall museum-wall feel rather than a feed. The Frame Tuner under [Hidden / developer](#hidden--developer) is the utility that calibrates those frame insets.

> The screenshot below uses placeholder entries while Parker is still building out her real pantry; the framing, layout, and progress row are real, but the specific bags shown aren't all hers yet.

![Pantry / Parker's Collection](screenshots/pantry.png)

### Bag detail: `/bags/:slug`

A single logged bag from Parker's pantry: her own photos, the store she found it at, the date, and the memory.

> The screenshot below shows a placeholder entry used while testing the upload flow; the page layout (framed hero photo, navy plaque, memory line) is real.

![Bag detail page](screenshots/bag-detail.png)

### About: `/about`

The story of the gift, the build, and the people. A "From the Crew" section gathers birthday notes from Parker's friends, several paired with a horizontal carousel of their photos. Also home to a hidden playlist (see [Easter eggs](#easter-eggs)). The intro is on the left, the "Under the Hood" technical writeup is on the right.

<table>
  <tr>
    <td valign="top" width="50%"><img src="screenshots/about-1.png" alt="About page, intro" width="100%" /></td>
    <td valign="top" width="50%"><img src="screenshots/about-2.png" alt="About page, Under the Hood" width="100%" /></td>
  </tr>
</table>

### Not Found: anything else

The catch-all 404, themed to match the rest of the site.

<p align="center"><img src="screenshots/not-found.png" alt="404 page" width="60%" /></p>

---

## Admin: `/admin`

The admin area is password-gated and noindexed; the public site never links into it. These views are only reachable by Parker (and anyone she gives the password to).

### Password gate

A simple password prompt. The password is held in memory only. It's never written to `localStorage` or `sessionStorage`, so a refresh re-prompts.

![Admin password gate](screenshots/admin-password-gate.png)

### Log a Bag

The everyday admin workflow: pick a bag from the Encyclopedia (filtered by Parker's [visibility settings](#settings)), pick the store, add the date, drop a memory line, attach photos. Submit commits the new pantry entry straight into the repo via the Cloudflare Worker.

<p align="center"><img src="screenshots/admin-log-a-bag.png" alt="Admin: Log a Bag" width="60%" /></p>

Two of this form's pickers are custom-built rather than off-the-shelf dropdowns, and they're worth calling out on their own.

**The bag picker** (left) is wired directly to the Encyclopedia, so Parker can only select bags that actually exist in the catalog. There's no free-text fallback. Every pantry entry is guaranteed to link back to a real encyclopedia row, which keeps the data clean and the cross-links honest.

**The store picker** (right) is searchable across every field at once. Type a city, a store number, part of a street address, a state abbreviation like "CA", or the full state name like "California", and the list narrows in real time. The point is to stay out of Parker's way, since she rarely remembers a store number off the top of her head.

<table>
  <tr>
    <td valign="top" width="50%"><img src="screenshots/admin-log-bag-picker.png" alt="Admin: Log a Bag, bag picker dropdown" width="100%" /></td>
    <td valign="top" width="50%"><img src="screenshots/admin-log-store-picker.png" alt="Admin: Log a Bag, store picker dropdown" width="100%" /></td>
  </tr>
</table>

### Edit Mode

A list of every logged pantry entry, each editable or deletable. The editing flow re-uses the Log-a-Bag form with a few intuitiveness touches added on top: the hero photo is explicitly labeled (so it's obvious which one appears on the pantry card), and small arrow controls sit beside each image so Parker can reorder her photos by nudging them left or right, without dragging or re-uploading.

<table>
  <tr>
    <td valign="top" width="50%"><img src="screenshots/admin-edit-list.png" alt="Admin: Edit Mode list" width="100%" /></td>
    <td valign="top" width="50%"><img src="screenshots/admin-edit-form.png" alt="Admin: Edit Mode editing an entry" width="100%" /></td>
  </tr>
</table>

### Add an Encyclopedia Entry

For adding brand-new bag designs to the catalog (rather than logging one Parker found). Used rarely. Most of the time the encyclopedia is complete enough that Parker is just picking from the existing list. The form is long enough that it's shown here in two halves: the top of the form is on the left, the bottom on the right.

<table>
  <tr>
    <td valign="top" width="50%"><img src="screenshots/admin-add-entry-1.png" alt="Admin: Add an Encyclopedia Entry, top half" width="100%" /></td>
    <td valign="top" width="50%"><img src="screenshots/admin-add-entry-2.png" alt="Admin: Add an Encyclopedia Entry, bottom half" width="100%" /></td>
  </tr>
</table>

### Settings

Parker's category-visibility toggles. State / Special / Standard can each be hidden from her Pantry views (the progress row, the type pills, the bag cards, and the Log-a-Bag picker). The Encyclopedia ignores this. It always shows every TJ bag.

<p align="center"><img src="screenshots/admin-settings.png" alt="Admin: Settings, Category Visibility" width="60%" /></p>

---

## Hidden / developer

### Frame Tuner: `/dev/frames`

A development utility for tuning the vintage photo frames in the Pantry: pick a frame, dial in the photo inset percentages, and preview against a representative photo. Used while building the framing system, kept around because the inset values still occasionally need a nudge when a new frame is added. Not linked from anywhere in the public UI.

![Frame Tuner](screenshots/frame-tuner.png)

---

## Easter eggs

A few surprises are tucked into the public site. Some are on the About page, some elsewhere.

The most findable one: a hidden playlist whose first track is "Bags" by Clairo (the live recording from Electric Lady). The rest are left as an exercise to the curious visitor.

<p align="center"><img src="screenshots/easter-egg-playlist.png" alt="Hidden playlist on About" width="60%" /></p>

---

## See also

- [`design-decisions.md`](design-decisions.md): the case-study writeup of why the site is shaped the way it is. Reads well alongside this visual tour.
- [`../README.md`](../README.md): the top-level project overview.
