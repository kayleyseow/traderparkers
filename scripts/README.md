# scripts/

Tooling for filling out encyclopedia entries with reference photos. Run from the repo root.

## scrape-poshmark.mjs

Scrapes Poshmark search + listing pages, downloading candidate photos to `staging/<slug>/<listingId>/photo-NN.jpg`.

### Usage

```
npm run scrape:poshmark
    Prints usage.

npm run scrape:poshmark -- --all-missing
    Scrape every encyclopedia entry that has no referencePhotos yet.

npm run scrape:poshmark <slug>
    Scrape one bag, using the query from the QUERIES map.

node scripts/scrape-poshmark.mjs <slug> "<query>" [maxListings]
    Scrape one bag with a custom search query.
```

### Behavior

- Slugs **must** match an existing encyclopedia entry `id`. The slug doubles as the staging folder name and the picker writes back to `entries[id].referencePhotos`.
- Throttled to ~1.25 req/sec (`THROTTLE_MS = 800`). 2 retries per failed request with linear backoff.
- Targets ~6 listings per bag by default. `--all-missing` prints an estimated runtime before starting.
- `staging/` is gitignored. Discard it once the picker has finalized everything.

## pick-photos.mjs

Boots a local HTTP picker at `http://localhost:5757` for assigning front/back/left/right/bottom to staged photos.

### Usage

```
npm run pick:photos              # opens picker at :5757
PORT=6173 npm run pick:photos    # override port
```

### What Finalize does

1. Runs `@imgly/background-removal-node` on each chosen photo.
2. Crops to the bag's bounding box with 4% padding, then pads transparently to a 4:5 portrait.
3. Writes `public/bags/[<material-or-type>/]<slug>/<angle>.png`. State bags land under `locations/`, jute under `jute-bags/`, canvas under `canvas-bags/`. Everything else writes directly under `public/bags/<slug>/`.
4. Updates `encyclopedia.json`: sets `referencePhotos` for whatever angles ended up on disk and records the source Poshmark listing URL per angle in `referencePhotoSources`.

### Behavior

- Hover a tile, press `1`/`2`/`3`/`4`/`5` to assign an angle. Click an angle button to toggle.
- Bags that already have `referencePhotos` are hidden from the picker. To redo one, clear that field by hand (or delete its `public/bags/<...>/<slug>/` dir) before relaunching.
- Partial sets are fine. Front + back only is valid for bags with only two distinct faces.
- Sharp is imported from `@imgly`'s nested copy on purpose. Loading a top-level sharp into the same process crashes with `ERR_DLOPEN_FAILED` on Windows.
- The picker uses port 5757 (not the 517x range) because Vite walks 5173 to 5179 when its default is busy and will silently shadow the picker if you forget which tab is which.
- Harmless GLib-GObject warnings may print on Windows when libvips initializes. They do not block finalization.

## Typical workflow

1. Add (or check) the `<slug>: '<query>'` pair in `QUERIES` in `scrape-poshmark.mjs`.
2. `npm run scrape:poshmark <slug>` to seed `staging/<slug>/`.
3. `npm run pick:photos`, walk through each staged bag, finalize.
4. Spot-check the resulting `public/bags/<...>/<slug>/*.png` and review the `encyclopedia.json` diff.
5. Delete `staging/` when done (gitignored, no cleanup needed).

## Other scripts

### prerender.mjs

Runs in `npm run build` after `vite build`. Generates static HTML files at `dist/encyclopedia/<id>/index.html` for every encyclopedia route so GitHub Pages serves them with HTTP 200 (not the SPA-fallback 404) and Googlebot sees the right title, meta description, OG/Twitter tags, and Product JSON-LD without running any JS. No manual invocation.

### scrape-stores.mjs

One-off scrape of `locations.traderjoes.com` to regenerate `public/data/stores.json` (647 store locations). Re-run only when refreshing store data; the output is checked in.

```
node scripts/scrape-stores.mjs
```

### scrape-tj-pdp.mjs

Fetches the official product photo (og:image PNG) from a Trader Joe's PDP URL. Handles the CDN's required `Referer: <pdp-url>` header, which is the gotcha that makes plain `curl` fail. Useful for standard bags that still have a current `traderjoes.com/home/products/pdp/...` listing, since those photos are higher quality than Poshmark scrapes.

```
node scripts/scrape-tj-pdp.mjs <outDir> <slug>=<pdpUrl> [<slug>=<pdpUrl> ...]
```

### bgremove.mjs

Standalone CLI for `@imgly/background-removal-node` + 4:5 crop. Mirrors the Finalize step inside `pick-photos.mjs` so you can run the same processing on a folder of images outside the picker workflow.

### measure-frames.mjs

Scans the alpha channel of rendered PNGs in `public/decor/frames/` to detect each vintage frame's transparent inset rectangle (where the photo shows through). Prints the inset data used to seed the `FRAME_INSET` map in `src/routes/Pantry.tsx`. Re-run when adding a new frame.

---

<p align="center">
  <img src="../src/assets/icons/orig_red_dot_tp_logo.png" alt="Trader Parker's Bag Bazaar" width="52" />
</p>
