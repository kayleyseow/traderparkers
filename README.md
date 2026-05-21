# Trader Parker's Bag Bazaar 🛍️

A love letter to Trader Joe's tote bags, and to its biggest fan, Parker ♥

The Bag Bazaar is two things at once: a complete reference catalog of every Trader Joe's reusable bag ever printed, and a personal scrapbook of the ones Parker actually owns. It's built with React, Vite, and TypeScript, and you can visit it live at [kayleyseow.github.io/tjbags](https://kayleyseow.github.io/tjbags/).

![Trader Parker's Bag Bazaar](docs/screenshot.png)

## Design

The site has two halves that stay deliberately separate, even though they cross-link. The **[Encyclopedia](https://kayleyseow.github.io/tjbags/encyclopedia)** (`/encyclopedia`) is a reference: every TJ bag design that exists, 85 entries spanning state bags, special editions, and standard bags. It stands on its own as a fan resource and never frames itself around what Parker happens to own. **[Parker's Collection](https://kayleyseow.github.io/tjbags/pantry)** (`/pantry`) is the personal half: the bags she's collected, each with her own photos, the store she found it in, the date, and the memory attached to it. Ownership shows up on the catalog side only as a quiet aside, never as a progress bar.

Everything ships as a static site to [GitHub Pages](https://pages.github.com), so there's no server in the hot path. The whole catalog is a handful of flat JSON files under `public/data/` — [`encyclopedia.json`](public/data/encyclopedia.json) holds every bag design, [`pantry.json`](public/data/pantry.json) holds Parker's collection, and [`stores.json`](public/data/stores.json) is a snapshot of every US Trader Joe's location. Cat's out of the bag: there's no database. The site just fetches these files and renders them. The dataset is small enough that this is about as simple and as fast as it gets, and editing a bag is as easy as editing a JSON file.

A bag that shares a shape with another but differs only in print (e.g. the mini canvas tote, which has Classic, Halloween, and Pastel versions) collapses into a single encyclopedia entry with switchable variants, rather than cluttering the catalog with near-duplicate pages. Older prints of a state bag are the exception: a genuinely different design of the same state earns its own entry, since the point of the catalog is to show how the bags changed over time.

The full reasoning behind all of this — every major decision, the tradeoffs, and where it would break at scale — is written up in [`docs/design-decisions.md`](docs/design-decisions.md).

### Saving bags

Parker logs new bags from her phone (or laptop, but I took extra precautions for .heic files, thanks Apple) through a password-gated admin form. Since GitHub Pages can't write anything, an optional [Cloudflare Worker](workers/README.md) sits behind that form and commits the new entry and photos straight to this repo, which triggers a rebuild. Every bag, every edit, every suggestion lands as a single git commit. (Enough to make any seasoned developer shed more than a few tears, I know.) If the Worker isn't deployed, the site still works completely; the form just falls back to showing the JSON to copy and paste in by hand. Nothing about the catalog depends on the backend existing.

### Photos

Most of the work in a project like this is photos, not code. The reference shots are scraped from resale listings, then run through background removal and cropped to a consistent 4:5 frame; Parker's own photos go through the same crop. The `scripts/` folder holds that whole pipeline — a scraper, a little local photo picker for assigning front/back/side angles, and a few smaller helpers. It has [its own README](scripts/README.md) if you want the details.

## Built with

[TypeScript](https://www.typescriptlang.org) and [React](https://react.dev) across the board, with [React Router](https://reactrouter.com) handling navigation and [Tailwind CSS](https://tailwindcss.com) for styling, all bundled by [Vite](https://vite.dev). The photo and scraping tooling under `scripts/` is plain [Node.js](https://nodejs.org), leaning on [sharp](https://sharp.pixelplumbing.com) and [heic-convert](https://www.npmjs.com/package/heic-convert) for image processing and [@imgly's background-removal library](https://github.com/imgly/background-removal-node) to cut bags out of resale photos. The optional backend is a [Cloudflare Worker](https://workers.cloudflare.com), written in TypeScript too.

## Running it locally

```bash
npm install
npm run dev
```

That's it — the site runs with no backend and no configuration. To wire up the live save-and-suggest flow, copy [`.env.example`](.env.example) to `.env.local` and follow [`workers/README.md`](workers/README.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check, build, and prerender static HTML for every encyclopedia route |
| `npm run preview` | Serve the production build locally |
| [`npm run scrape:poshmark`](scripts/scrape-poshmark.mjs) | Scrape candidate reference photos for an encyclopedia entry |
| [`npm run pick:photos`](scripts/pick-photos.mjs) | Launch the local picker for assigning photo angles |

The two photo commands are just the entry points to a larger pipeline — scraping, background removal, cropping, and writing entries back to `encyclopedia.json`. That whole workflow has [its own README in `scripts/`](scripts/README.md).

## Deployment

The site deploys itself. Every push to `main` triggers a [GitHub Actions](https://github.com/features/actions) workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that runs `npm run build` and publishes the result to GitHub Pages.

The build does one thing worth calling out. A single-page app normally serves the same empty HTML shell for every URL, which is bad for deep links and invisible to search engines. So after Vite finishes, the build [prerenders](scripts/prerender.mjs) a real static HTML file for every encyclopedia route — each one carrying the right title, meta tags, and structured data — and the workflow copies `index.html` to `404.html` so GitHub Pages hands unknown paths back to React Router instead of erroring. [A link straight to a single bag](https://kayleyseow.github.io/tjbags/encyclopedia/nj) returns a true page, not a blank shell.

## License

The source code in this repository is licensed under the [MIT License](LICENSE), so you're welcome to learn from it and reuse it.

The code is all that license covers. It does not extend to the bag catalog data or the reference photos, Parker's own collection photos, the Trader Joe's script font ([CC BY-NC](https://creativecommons.org/licenses/by-nc/4.0/)), or the Trader Joe's name, wordmark, and visual style. Those belong to their respective owners and are used here only under their own terms. See [Credits](#credits) for the full list.

## Credits

This is an unofficial fan project and isn't affiliated with or endorsed by Trader Joe's. The vintage engravings throughout the site come from [The Graphics Fairy](https://thegraphicsfairy.com/), and the type is set in [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) with the [Trader Joe's script font](https://www.fontspace.com/trader-joes-font-f34830) by [Fontopia](https://www.fontspace.com/fontopia) for the headings. Made with love as a birthday gift.

And somewhere on [the About page](https://kayleyseow.github.io/tjbags/about) there's a hidden playlist. The first song is "Bags," by Clairo. You'll have to find the rest of the surprises.

---

<p align="center">
  <img src="src/assets/icons/orig_red_dot_tp_logo.png" alt="Trader Parker's Bag Bazaar" width="52" />
</p>
