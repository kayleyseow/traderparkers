import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import TopNav from '../TopNav'
import Footer from '../Footer'
import StoreChip from '../StoreChip'
import redDotLogo from '../assets/icons/orig_red_dot_tp_logo.png'
import parkerChopsticks from '../assets/parker/p-chopsticks.jpg'
import parkerKBull from '../assets/parker/p-k-bull.jpeg'
import parkerMast from '../assets/parker/p-r-mast.jpeg'
import parkerHike from '../assets/parker/hike-selfie.jpg'
import parkerSunset from '../assets/parker/sunset-selfie.jpg'
import parkerScreenshot from '../assets/parker/p-n-screenshot.jpg'
import parkerPointFive from '../assets/parker/p-point-five.jpg'
import tejaTimesSquareHeart from '../assets/parker/t-p-times-square-heart.jpeg'
import tejaTree from '../assets/parker/t-p-tree.jpeg'
import tejaStairs from '../assets/parker/p-stairs.jpeg'
import tejaTimesSquare from '../assets/parker/t-p-times-square.jpeg'
import tejaSelfie from '../assets/parker/t-p-selfie.jpeg'
import { useTitle } from '../useTitle'

const BASE = import.meta.env.BASE_URL

/* Easter-egg playlist behind the red-dot logo on the bazaar-stall awning.
   See BazaarSecret below for the click gestures. CSP allows www.youtube.com
   in frame-src. To add/swap a track: drop in the YouTube video ID (the part
   after `v=` or after `youtu.be/`), plus a friendly title + artist for the
   now-playing chip and an optional `start` offset in seconds. */
type SecretTrack = { id: string; title: string; artist: string; start?: number }
const BAZAAR_SECRET_TRACKS: SecretTrack[] = [
  { id: 'CeA92xqw-QI', title: 'Bags', artist: 'Clairo', start: 6 },
  { id: 'UWhY6kfKEts', title: 'Brazil', artist: 'Declan McKenna', start: 4 },
  { id: '_hLJeGl9wi8', title: 'Money Machine', artist: '100 gecs' },
  { id: 'R_iTpfSCIVk', title: 'Pink Pony Club', artist: 'Chappell Roan' },
]

export default function About() {
  useTitle(
    'About',
    "The story behind Trader Parker's Bag Bazaar — a birthday-gift archive of Trader Joe's reusable totes, built one design at a time.",
    true,
  )
  return (
    <main className="relative min-h-screen bg-[var(--tj-cream)] text-[var(--tj-ink)] px-6 pt-6 md:pt-8 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <TopNav />

        <div className="max-w-2xl mx-auto">

        <header className="text-center mb-10">
          <p className="font-[var(--tj-body)] tracking-[0.4em] text-xs uppercase font-semibold border border-[var(--tj-ink)] inline-block px-4 py-1.5 mb-6">
            About
          </p>
          <h1
            className="text-[var(--tj-red)] text-6xl md:text-7xl leading-none"
            style={{ fontFamily: 'var(--tj-script)' }}
          >
            About the Bazaar
          </h1>
          <p className="font-[var(--tj-body)] italic text-base md:text-lg mt-4 max-w-xl mx-auto opacity-75">
            A small museum for a particular kind of grocery-store souvenir.
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-[var(--tj-ink)]/40" />
        </header>

        {/* Hero ornament. The red-dot logo on the awning is the secret play/stop button. */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <img
              src={`${BASE}decor/spots/scenes/bazaar-stall.svg`}
              alt=""
              aria-hidden
              className="h-52 md:h-64 w-auto opacity-90 select-none"
            />
            <BazaarSecret />
          </div>
        </div>

        <article className="space-y-12 text-base leading-relaxed font-serif">

          <Section
            label="The tl;dr"
            marginCat={<MarginCat file="spots/cats/cat-dress-color.svg" side="left" mirror tagline="Once upon a tote" />}
          >
            <p>
              <BirthdayGreeting />
            </p>
            <p>
              <FramedPhoto
                frame="frames/rococo-oval.svg"
                aspect="796 / 991"
                inset={{ top: '16%', right: '18%', bottom: '15.5%', left: '18%' }}
                float="right"
                swing
                slides={[
                  {
                    src: parkerKBull,
                    alt: 'Kayley and Parker',
                    zoom: 1.2,
                    caption: (
                      <>
                        By the horns
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Apr 2026 · FiDi, NYC
                        </span>
                      </>
                    ),
                  },
                  {
                    src: parkerScreenshot,
                    alt: 'Parker (screenshot)',
                    zoom: 1.2,
                    caption: (
                      <>
                        council of uncs
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Sep 2025 · Discord
                        </span>
                      </>
                    ),
                  },
                  {
                    src: parkerPointFive,
                    alt: 'Parker (0.5x)',
                    zoom: 1.2,
                    caption: (
                      <>
                        sorry parker
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Apr 2026 · Dumbo, NYC
                        </span>
                      </>
                    ),
                  },
                ]}
              />
              Ahoy! This website started as a way for you to document your growing TJ's bag collection—your bazaar, if I may—but I fear it's turned into something more.
              There was no way of realizing how deep the{' '}
              <InlineLink href="https://www.traderjoes.com">
                Trader Joe's
              </InlineLink>{' '}
              bag archive went. State bags turned into city totes, cities into limited edition releases, limited releases into bags you can't even purchase. In the span of a 
              week, I've learned more about Trader Joe's bags than I'll ever need to and hey, we can confidently say this website hosts{' '}
              <Link
                to="/encyclopedia"
                className="underline underline-offset-2 hover:text-[var(--tj-red)]"
              >
                the world's first (and only!) TJ's tote encyclopedia
              </Link>
              <FootnoteRef n={1} />. From one trader to another, I hope you love this corner of the internet, and that it stays a small reminder to always get the bag(s).
            </p>
            <p className="text-left italic opacity-75">
              safe travels,
              <br />
              Trader Kayley
            </p>
          </Section>

          <Section
            label="About our Trader"
            marginCat={<MarginCat file="spots/cats/cat-tophat-color.svg" side="right" mirror tagline="Tipping the hat" />}
          >
            <p>
              <FramedPhoto
                frame="frames/horizontal-hung.svg"
                aspect="1178 / 1146"
                inset={{ top: '28%', right: '13%', bottom: '12%', left: '13%' }}
                float="left"
                swing
                slides={[
                  {
                    src: parkerChopsticks,
                    alt: 'Parker with chopsticks',
                    zoom: 1.3,
                    caption: (
                      <>
                        category: chopstick supremacy
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Aug 2024 · Intl District
                        </span>
                      </>
                    ),
                  },
                  {
                    src: parkerHike,
                    alt: 'Parker on the way to a hike, in the car',
                    fit: 'contain',
                    zoom: 1.05,
                    caption: (
                      <>
                        backseat princesses
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Jun 2024 · otw 2 Lake 22
                        </span>
                      </>
                    ),
                  },
                  {
                    src: parkerMast,
                    alt: 'Parker at Discovery Park',
                    fit: 'contain',
                    zoom: 1.2,
                    caption: (
                      <>
                        serving cunt
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Jul 2024 · Discovery Park
                        </span>
                      </>
                    ),
                  },
                  {
                    src: parkerSunset,
                    alt: 'Parker at sunset',
                    fit: 'contain',
                    zoom: 1.1,
                    caption: (
                      <>
                        golden hour
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Jul 2024 · Dungeness Spit Trail
                        </span>
                      </>
                    ),
                  },
                ]}
              />
              Trader Parker is the kind of person who treats every single TJ's run like a minor expedition. While our trader is keen on exploring new releases, 
              she is documented to swear by a staple dinner item, her saving grace: the{' '}
              <InlineLink href="https://www.traderjoes.com/home/products/pdp/organic-red-lentil-sedanini-058259">
                red lentil pasta
              </InlineLink>
              , for the "protein"<FootnoteRef n={2} />. For breakfast, she's bound to grab a heaping scoop of{' '}
              <InlineLink href="https://www.traderjoes.com/home/products/pdp/nonfat-plain-greek-yogurt-062905">
                nonfat plain greek yogurt
              </InlineLink>
              . And not to forget, although not a TJ's item, she does love her{' '}
              <InlineLink href="https://www.costco.com/p/-/kirkland-signature-protein-bar-variety-pack-212-oz-20-count/100296198">
                cardboard fix
              </InlineLink>
              , also "for the protein." This one's just for snack time, though.
            </p>
            <p>
              The crew vividly remembers after-work Trader Joe's runs
              to <StoreChip storeNumber="137" className="px-[0.5em] py-[0.05em] gap-[0.2em] text-[0.85em]" /> during that one summer in
              Seattle (especially the pre-hike snack runs). Trader Kayley's favorite memory is of them lugging
              two{' '}
              <InlineLink href="https://www.traderjoes.com/home/products/pdp/purified-water-080802">
                24-packs of water
              </InlineLink>{' '}
              half an hour back to the apartment
              <FootnoteRef n={3} /> in preparation for the (very wild) one-day Olympics trip<FootnoteRef n={4} />. What can we say, #worthit & #wesurvived.
            </p>
          </Section>

          <Section
            label="From the Crew"
            marginCat={<MarginCat file="spots/cats/cat-lake.jpg" side="left" tagline="Off the clock" />}
          >
            <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-8">
              {/* Placeholder frame for Nick — add `src` / `alt` / `caption` when his photo arrives. */}
              <FramedPhoto
                frame="frames/cartouche.svg"
                aspect="600 / 506"
                inset={{ top: '13%', right: '11%', bottom: '13%', left: '11%' }}
                swing
              />
              <div className="flex-1 min-w-0 space-y-4">
                <p>
                  Trader Nick's placeholder. Hey Nick, when you find
                  yourself in the codebase: open{' '}
                  <code className="font-mono text-[0.85em] bg-[var(--tj-ink)]/5 px-1 py-[0.05em] rounded-sm">
                    src/routes/About.tsx
                  </code>{' '}
                  in your editor, hit{' '}
                  <kbd className="font-[var(--tj-body)] tracking-[0.1em] text-[0.75em] uppercase border border-[var(--tj-ink)]/40 rounded-sm px-1 py-[0.05em]">
                    Ctrl+Shift+F
                  </kbd>{' '}
                  , and search for "Trader Nick" to land right
                  here. Rewrite this paragraph with whatever you'd like to
                  say to Parker for her birthday, keep the "- Trader Nick"
                  signoff at the bottom so future-you can find it again.
                </p>
                <p className="text-left italic opacity-75">
                  - Trader Nick
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <FramedPhoto
                frame="frames/crested-square.svg"
                aspect="840 / 978"
                inset={{ top: '17.5%', right: '21.5%', bottom: '21.5%', left: '21.5%' }}
                swing
                widthClass="w-[258px] sm:w-[306px]"
                captionClass="-mt-6"
                slides={[
                  {
                    src: tejaTimesSquareHeart,
                    alt: 'Teja and Parker, heart hands in Times Square',
                    caption: (
                      <>
                        queens of hearts
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Dec 2025 · Times Square, NYC
                        </span>
                      </>
                    ),
                  },
                  {
                    src: tejaTree,
                    alt: 'Teja and Parker by a tree',
                    zoom: 1.3,
                    shiftY: '-8%',
                    caption: (
                      <>
                        deck the halls
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Dec 2025 · Manhattan, NYC
                        </span>
                      </>
                    ),
                  },
                  {
                    src: tejaStairs,
                    alt: 'Parker on the stairs',
                    caption: (
                      <>
                        pretty in pink
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Dec 2025 · Manhattan, NYC
                        </span>
                      </>
                    ),
                  },
                  {
                    src: tejaTimesSquare,
                    alt: 'Teja and Parker in Times Square',
                    zoom: 1.8,
                    shiftY: '-10%',
                    caption: (
                      <>
                        double trouble in the big apple
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Dec 2025 · Times Square, NYC
                        </span>
                      </>
                    ),
                  },
                  {
                    src: tejaSelfie,
                    alt: 'Teja and Parker selfie',
                    caption: (
                      <>
                        the it girls
                        <span className="block not-italic font-[var(--tj-body)] tracking-[0.22em] text-[0.55rem] uppercase opacity-60 mt-1">
                          Dec 2025 · Manhattan, NYC
                        </span>
                      </>
                    ),
                  },
                ]}
              />
              <div className="flex-1 min-w-0 space-y-4">
                <p>
                  Trader Teja's placeholder. Hey Teja, when you find
                  yourself in the codebase: open{' '}
                  <code className="font-mono text-[0.85em] bg-[var(--tj-ink)]/5 px-1 py-[0.05em] rounded-sm">
                    src/routes/About.tsx
                  </code>{' '}
                  in your editor, hit{' '}
                  <kbd className="font-[var(--tj-body)] tracking-[0.1em] text-[0.75em] uppercase border border-[var(--tj-ink)]/40 rounded-sm px-1 py-[0.05em]">
                    Ctrl+Shift+F
                  </kbd>{' '}
                  , and search for "Trader Teja" to land right
                  here. Rewrite this paragraph with whatever you'd like to
                  say to Parker for her birthday, keep the "- Trader Teja"
                  signoff at the bottom so future-you can find it again.
                </p>
                <p className="text-left italic opacity-75">
                  - Trader Teja
                </p>
              </div>
            </div>
          </Section>

          <Section
            label="Under the Hood"
            marginCat={<MarginCat file="icons/magnifying-glass.svg" side="right" mirror tagline="Mind the seams" tilt={20} />}
          >
            <SubSection label="Tech Stack">
              <ul className="space-y-3 list-none p-0 pl-6">
                <CreditRow
                  title="Built With"
                  detail={
                    <>
                      <InlineLink href="https://react.dev">React</InlineLink>
                      ,{' '}
                      <InlineLink href="https://reactrouter.com">
                        React Router
                      </InlineLink>
                      ,{' '}
                      <InlineLink href="https://vite.dev">Vite</InlineLink>
                      ,{' '}
                      <InlineLink href="https://www.typescriptlang.org">
                        TypeScript
                      </InlineLink>
                      ,{' '}
                      <InlineLink href="https://tailwindcss.com">
                        Tailwind
                      </InlineLink>
                    </>
                  }
                />
                <CreditRow
                  title="Backend"
                  detail={
                    <>
                      admin and suggestions handled by a{' '}
                      <InlineLink href="https://workers.cloudflare.com">
                        Cloudflare Worker
                      </InlineLink>{' '}
                      committing to GitHub via the{' '}
                      <InlineLink href="https://docs.github.com/en/rest/git">
                        Git Data API
                      </InlineLink>
                      , with{' '}
                      <InlineLink href="https://www.cloudflare.com/products/turnstile/">
                        Turnstile
                      </InlineLink>{' '}
                      for captcha
                    </>
                  }
                />
                <CreditRow
                  title="Deployment"
                  detail={
                    <>
                      auto-deployed via{' '}
                      <InlineLink href="https://github.com/features/actions">
                        GitHub Actions
                      </InlineLink>{' '}
                      on every push to main, hosted on{' '}
                      <InlineLink href="https://pages.github.com">
                        GitHub Pages
                      </InlineLink>
                    </>
                  }
                />
                <CreditRow
                  title="Pic Processing"
                  detail={
                    <>
                      HEIC conversion via{' '}
                      <InlineLink href="https://www.npmjs.com/package/heic-convert">
                        heic-convert
                      </InlineLink>
                      , background removal via{' '}
                      <InlineLink href="https://github.com/imgly/background-removal-node">
                        @imgly/background-removal-node
                      </InlineLink>
                      , image resizing via{' '}
                      <InlineLink href="https://sharp.pixelplumbing.com">
                        sharp
                      </InlineLink>
                    </>
                  }
                />
                <CreditRow
                  title="Source Code"
                  detail={
                    <InlineLink href="https://github.com/kayleyseow/tjbags">
                      github.com/kayleyseow/tjbags
                    </InlineLink>
                  }
                />
              </ul>
            </SubSection>
            <SubSection label="The Archive">
            <p>
              The archive holds 85 entries: 43 state bags, 29 specials, 13
              standards. There is no single source for any of this. It
              started as a hunt for a bag in every state with a
              Trader Joe's, one painstaking search at a time,
              cross-referenced against the Trader Joe's
              Bag Swap Group's community checklist
              <FootnoteRef n={5} /> (March 2023, 63 polypropylene bags),
              with the special-edition releases stitched in by hand. 344 reference photos were dug up from{' '}
              <InlineLink href="https://www.reddit.com/r/traderjoes">
                Reddit
              </InlineLink>
              ,{' '}
              <InlineLink href="https://poshmark.com">Poshmark</InlineLink>
              ,{' '}
              <InlineLink href="https://www.etsy.com">Etsy</InlineLink>,{' '}
              <InlineLink href="https://www.amazon.com">Amazon</InlineLink>
              , and{' '}
              <InlineLink href="https://www.ebay.com">eBay</InlineLink>
              , mostly one at a time. The 43 state bags came first, done
              by hand over one long night: find each listing, download
              the photos, knock out the background in Adobe Illustrator,
              crop, rotate, then bundle and label everything into
              folders, one bag at a time. That night is what prompted
              the{' '}
              <InlineLink href="https://github.com/kayleyseow/tjbags/blob/main/scripts/scrape-poshmark.mjs">
                Poshmark scraper
              </InlineLink>
              , which took over most of the haul for the special and
              standard bags. Poshmark specifically, because sellers
              there reliably upload front, back, left, right, and bottom
              shots of each bag, which is exactly the multi-angle
              structure the archive uses. In hindsight, a proper
              general-purpose scraper would have turned many long nights
              into one afternoon. The harder half is still figuring out
              what to look for in the first place. The one shortcut
              throughout was Claude, which could read each photo and
              describe what it saw, so writing every caption and blurb
              didn't end up taking twice as long.
            </p>
            </SubSection>
            <SubSection label="The Pipeline">
            <p>
              Each bag photo runs through a small pipeline before it
              lands on the page. iPhone shots come in as{' '}
              <InlineLink href="https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format">
                HEIC
              </InlineLink>
              , as Apple just LOVES being special, and get converted to
              JPEG via{' '}
              <InlineLink href="https://www.npmjs.com/package/heic-convert">
                heic-convert
              </InlineLink>
              . Backgrounds are then knocked out with{' '}
              <InlineLink href="https://github.com/imgly/background-removal-node">
                @imgly's background-removal-node
              </InlineLink>
              , and{' '}
              <InlineLink href="https://sharp.pixelplumbing.com">
                sharp
              </InlineLink>{' '}
              resizes everything to a consistent width. The background
              removal is genuinely good, but it stumbles when the bag is
              close in color to whatever it was shot against, or when
              there is a lot going on in the shot; those photos get
              pulled aside and cleaned, cropped, and rotated by hand
              instead.
            </p>
            <p>
              On top of that goes a vintage engraved frame from{' '}
              <InlineLink href="https://thegraphicsfairy.com">
                The Graphics Fairy
              </InlineLink>
              . Each entry can carry multiple angles (back, left,
              right), so a single bag is often a small folder of shots.
              Frames are picked round-robin from a pool whose aspect
              matches the photo, so landscape shots land on landscape
              frames and no single frame gets reused too often. A
              handful of bags have manual overrides where the auto-pick
              didn't quite fit. Half of that pipeline is automated; the
              other half (deciding which shots are good, nudging a frame
              inset that's off by two percent) is painstaking, and a
              unified culler-cleaner-fitter would have saved most of it.
            </p>
            </SubSection>
            <SubSection label="The Backend">
            <p>
              Cat's out of the bag: there is no database.
            </p>
            <p>
              Admin edits and Suggest-a-bag
              submissions go through a small{' '}
              <InlineLink href="https://workers.cloudflare.com">
                Cloudflare Worker
              </InlineLink>{' '}
              that commits straight to the{' '}
              <InlineLink href="https://github.com/kayleyseow/tjbags">
                GitHub repo
              </InlineLink>{' '}
              via the{' '}
              <InlineLink href="https://docs.github.com/en/rest/git">
                Git Data API
              </InlineLink>
              , so each submission lands as a single atomic commit even
              when it touches multiple files. Every bag, every edit,
              every suggestion is a git commit. (This is enough to make any seasoned developer shed a few tears, I know.){' '}
              <InlineLink href="https://www.cloudflare.com/products/turnstile/">
                Turnstile
              </InlineLink>{' '}
              sits in front of the Suggest form to keep the bots out.
              The whole thing works because the site is small and
              slow-moving. It would not scale to anything bigger; it is,
              plainly, a weekend's worth of architectural choices.
            </p>
            </SubSection>
            <SubSection label="The Polish">
            <p>
              Accessibility was not an afterthought. Every flourish on
              the site (confetti bursts, swinging frames, cat fade-ins,
              hover wiggles, polaroid lifts) respects{' '}
              <InlineLink href="https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion">
                prefers-reduced-motion
              </InlineLink>
              , so if your system asks for less motion, the animations
              soften or sit still entirely. Hover-driven effects are
              switched off on touch screens so they never fire on a
              stray tap. The decorative art is hidden from screen
              readers while every real control keeps a plain-text label,
              headings and landmarks are properly structured, anchor
              links land clear of the sticky nav, and every interactive
              piece (the hidden ones included) works from the keyboard
              with Enter and Space.
            </p>
            <details className="group">
              <summary className="cursor-pointer list-none font-[var(--tj-body)] tracking-[0.18em] text-[0.7rem] uppercase opacity-75 hover:opacity-100 hover:text-[var(--tj-red)] transition-opacity">
                psst, a few things worth finding [click me!]
              </summary>
              <p className="mt-3">
                On this page, hover the birthday greeting up top, brush
                one of the hung photos, give the red dot on the
                bazaar's awning a tap, and slow down near the cats in
                the margins. Around the rest of the site, decline the
                welcome on the landing page and hover the figures
                tucked into the encyclopedia gallery's margins.
              </p>
            </details>
            <p>
              In sum: a one-line idea ("document Parker's growing tote
              collection") quietly outgrew itself into a fully cataloged,
              version-controlled, captcha-protected weekend obsession.
              What was meant to be a birthday card became an
              encyclopedia engine.<FootnoteRef n={6} />
            </p>
            </SubSection>
          </Section>

          <Section
            label="Credits & Thanks"
            marginCat={<MarginCat file="spots/cats/cat-tux-color.svg" side="right" tagline="Much obliged" />}
          >
            <ul className="space-y-3 list-none p-0">
              <CreditRow
                title="Fonts"
                detail={
                  <>
                    script by{' '}
                    <InlineLink href="https://www.fontspace.com/fontopia">
                      Fontopia
                    </InlineLink>{' '}
                    (
                    <InlineLink href="https://creativecommons.org/licenses/by-nc/4.0/">
                      CC BY-NC
                    </InlineLink>
                    ) via{' '}
                    <InlineLink href="https://www.fontspace.com/trader-joes-font-f34830">
                      Fontspace
                    </InlineLink>
                    {' · '}body{' '}
                    <InlineLink href="https://fonts.google.com/specimen/Source+Serif+4">
                      Source Serif 4
                    </InlineLink>{' '}
                    by{' '}
                    <InlineLink href="https://github.com/adobe-fonts/source-serif">
                      Adobe
                    </InlineLink>{' '}
                    (
                    <InlineLink href="https://openfontlicense.org">
                      OFL
                    </InlineLink>
                    )
                  </>
                }
              />
              <CreditRow
                title="Vintage Illustrations"
                detail={
                  <>
                    public-domain engravings from{' '}
                    <InlineLink href="https://thegraphicsfairy.com">
                      The Graphics Fairy
                    </InlineLink>
                  </>
                }
              />
              <CreditRow
                title="Reference Photos"
                detail={
                  <>
                    sourced from the Trader Joe's collector community across{' '}
                    <InlineLink href="https://poshmark.com">Poshmark</InlineLink>
                    ,{' '}
                    <InlineLink href="https://www.mercari.com">Mercari</InlineLink>
                    ,{' '}
                    <InlineLink href="https://www.etsy.com">Etsy</InlineLink>
                    ,{' '}
                    <InlineLink href="https://www.amazon.com">Amazon</InlineLink>
                    ,{' '}
                    <InlineLink href="https://www.ebay.com">eBay</InlineLink>
                    , and{' '}
                    <InlineLink href="https://www.reddit.com/r/traderjoes">
                      r/traderjoes
                    </InlineLink>
                  </>
                }
              />
              <CreditRow
                title="Poly Bag Inventory"
                detail={
                  <>
                    cross-referenced against the Trader Joe's Bag Swap
                    Group's community checklist
                    <FootnoteRef n={5} repeat /> of 63 polypropylene bags
                    (March 2023 revision)
                  </>
                }
              />
              <CreditRow
                title="Store Locations"
                detail={
                  <>
                    scraped from{' '}
                    <InlineLink href="https://locations.traderjoes.com">
                      locations.traderjoes.com
                    </InlineLink>{' '}
                    (thanks for the clean sitemap)
                  </>
                }
              />
            </ul>
          </Section>

          <Section
            label="Notes"
            marginCat={<MarginCat file="spots/cats/cat-red-umbrella-color.svg" side="left" tagline="Just in case" topClass="-top-[24rem]" />}
          >
            <p className="italic">
              Trader Joe's, the wordmark, and the visual style being lovingly
              imitated here all belong to Trader Joe's Company. This site is a
              personal, non-commercial fan project, made for their biggest fan.
            </p>
            <ol className="list-none p-0 m-0 mt-6 pt-4 border-t border-[var(--tj-ink)]/20 text-xs space-y-2 opacity-75">
              <Footnote n={1}>
                As far as we can tell. If a more thorough one exists, please
                point us at it!
              </Footnote>
              <Footnote n={2}>
                Yes, the box really does say "protein." Trader Kayley tried it once with{' '}
                <InlineLink href="https://www.traderjoes.com/home/products/pdp/organic-vodka-sauce-059975">
                vodka sauce
                </InlineLink>{' '}
                but found out she did not share the same love of it. She sticks to{' '}
                <InlineLink href="https://www.traderjoes.com/home/products/pdp/italian-fusilli-009295">
                  regular pasta
                </InlineLink>{' '}
                now.
              </Footnote>
              <Footnote n={3}>
                Bad enough that our valiant traders took the 31 bus one stop down Roosevelt Way.
              </Footnote>
              <Footnote n={4}>
                See the "golden hour" slide on the frame above (
                <InlineLink href="https://www.fws.gov/apps/carp/rivers/refuge/dungeness/visit-us/activities">
                  Dungeness Spit Trail
                </InlineLink>
                , lighthouse, Port Angeles, WA). It was taken at the end of the Olympics
                daytrip. Taken at sunset, pre-lighthouse.
              </Footnote>
              <Footnote n={5}>
                Per the{' '}
                <InlineLink href="https://www.facebook.com/groups/1718013795118071/">
                  Trader Joe's Bag Swap Group
                </InlineLink>
                's pinned community{' '}
                <InlineLink href={`${BASE}bags/poly-bag-list.webp`}>
                  checklist
                </InlineLink>{' '}
                (private Facebook group, March 2023 revision).
              </Footnote>
              <Footnote n={6}>
                Trader Kayley regrets nothing.
              </Footnote>
            </ol>
          </Section>
        </article>

        </div>
      </div>
      <Footer />
    </main>
  )
}

function Section({
  label,
  marginCat,
  children,
}: {
  label: string
  marginCat?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="relative flow-root">
      {marginCat}
      <h2 className="clear-both font-[var(--tj-body)] tracking-[0.3em] text-[0.7rem] uppercase mb-4 flex items-center gap-3 before:content-[''] before:h-px before:flex-1 before:bg-[var(--tj-ink)]/30 after:content-[''] after:h-px after:flex-1 after:bg-[var(--tj-ink)]/30">
        {label}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function SubSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="font-[var(--tj-body)] tracking-[0.25em] text-[0.65rem] uppercase opacity-75 mb-3 text-left">
        {label}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function MarginCat({
  file,
  side,
  mirror = false,
  tagline,
  tilt = 0,
  topClass = 'top-0',
}: {
  file: string
  side: 'left' | 'right'
  mirror?: boolean
  tagline?: string
  /** Extra rotation in degrees. Positive = clockwise. */
  tilt?: number
  /** Tailwind top-* class to override the default `top-0` anchor (e.g. `-top-20` to lift). */
  topClass?: string
}) {
  const sideClass = side === 'left' ? '-left-44' : '-right-44'
  const defaultFlip = side === 'left'
  const flip = mirror ? !defaultFlip : defaultFlip
  const transformParts = [
    flip ? 'scaleX(-1)' : '',
    tilt ? `rotate(${tilt}deg)` : '',
  ].filter(Boolean)
  return (
    <aside
      aria-hidden
      className={`group hidden xl:block absolute ${sideClass} ${topClass} w-32 select-none`}
    >
      <img
        src={`${BASE}decor/${file}`}
        alt=""
        className="w-full h-auto opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={transformParts.length ? { transform: transformParts.join(' ') } : undefined}
      />
      {tagline && (
        <div
          className={`mt-3 flex items-center gap-1.5 ${
            side === 'left' ? 'justify-start' : 'justify-end flex-row-reverse'
          } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        >
          <span className="h-px w-0 group-hover:w-4 bg-[var(--tj-ink)]/60 shrink-0 transition-[width] duration-500" />
          <span className="font-[var(--tj-body)] tracking-[0.18em] text-[0.55rem] uppercase whitespace-nowrap opacity-80">
            {tagline}
          </span>
        </div>
      )}
    </aside>
  )
}

function CreditRow({ title, detail }: { title: string; detail: React.ReactNode }) {
  return (
    <li className="flex items-baseline gap-2.5">
      <img
        src={`${BASE}decor/icons/finger-point-right.svg`}
        alt=""
        aria-hidden
        className="h-3 w-auto shrink-0 opacity-50 translate-y-[0.05em]"
      />
      <span className="font-[var(--tj-body)] tracking-[0.2em] text-[0.65rem] uppercase shrink-0 opacity-75">
        {title}
      </span>
      <span className="text-sm">{detail}</span>
    </li>
  )
}

/* Photo with a vintage frame overlay. Mirrors the pantry's framing pattern:
   photo sits behind the frame, inset to fit the frame's hollow center, and
   the frame SVG hangs over the top so its edges can extend decoratively. */
type FramedPhotoSlide = {
  src: string
  alt: string
  caption?: React.ReactNode
  /** CSS scale multiplier applied to this slide's image (1.0 = no zoom).
      Useful when a photo needs to be cropped tighter inside the frame. */
  zoom?: number
  /** Vertical shift for the photo inside its inset (e.g. '-10%' to shift up).
      Pairs with zoom > 1 to re-center the visible crop. */
  shiftY?: string
  /** 'cover' (default) crops to fill the frame's window; 'contain' shows
      the whole photo with kraft-colored letterboxing when aspects differ. */
  fit?: 'cover' | 'contain'
  /** Optional per-slide frame override (e.g. portrait vs landscape).
      Defaults to the component-level `frame`. `aspect` and `inset` must
      be passed alongside `frame` since each SVG has its own window. */
  frame?: string
  aspect?: string
  inset?: { top: string; right: string; bottom: string; left: string }
}

function FramedPhoto({
  src,
  alt,
  frame,
  aspect,
  inset,
  float,
  caption,
  swing = false,
  zoom,
  fit,
  slides,
  widthClass = 'w-52 sm:w-64',
  captionClass = 'mt-1.5',
}: {
  src?: string
  alt?: string
  frame: string
  aspect: string
  inset: { top: string; right: string; bottom: string; left: string }
  float?: 'left' | 'right'
  caption?: React.ReactNode
  /** When true, the frame rotates around its top edge on hover with a
      slight overshoot, and on mouse-out plays a damped pendulum decay
      animation. Best for frames that visually hang from hardware. */
  swing?: boolean
  /** Single-photo zoom shortcut. Equivalent to setting `zoom` on a slide.
      Ignored when `slides` is provided (use per-slide zoom instead). */
  zoom?: number
  /** Single-photo fit shortcut. Ignored when `slides` is provided. */
  fit?: 'cover' | 'contain'
  /** When provided, the frame becomes a click-to-cycle gallery. Each click
      advances to the next slide. Hover-swing still works independently. */
  slides?: FramedPhotoSlide[]
  /** Tailwind width classes for the frame. Defaults to `w-52 sm:w-64`. */
  widthClass?: string
  /** Tailwind margin/spacing classes for the caption block (e.g. `-mt-6` to
      tuck the caption up into the bottom of the frame). Defaults to `mt-1.5`. */
  captionClass?: string
}) {
  const effectiveSlides: FramedPhotoSlide[] =
    slides && slides.length > 0
      ? slides
      : [{ src: src ?? '', alt: alt ?? '', caption, zoom, fit }]
  const [slideIdx, setSlideIdx] = useState(0)
  const current = effectiveSlides[slideIdx % effectiveSlides.length]
  const hasMultiple = effectiveSlides.length > 1
  const advance = () => {
    if (hasMultiple) setSlideIdx((i) => (i + 1) % effectiveSlides.length)
  }
  // Per-slide overrides fall back to component-level defaults.
  const slideFrame = current.frame ?? frame
  const slideAspect = current.aspect ?? aspect
  const slideInset = current.inset ?? inset
  // 'rest' = settled at 0deg. 'hover' = transitioning/held at ±3deg.
  // 'release' = playing the pendulum-release keyframe back to 0.
  // 'side' = which half of the frame the cursor entered from; flips the
  // direction of the swing so left-enters swing left, right-enters swing
  // right. Latched on enter so the in-flight animation doesn't change
  // direction if the cursor wanders.
  const [phase, setPhase] = useState<'rest' | 'hover' | 'release'>('rest')
  const [side, setSide] = useState<'left' | 'right'>('right')

  const floatClass =
    float === 'left'
      ? 'float-left mr-5 mb-3'
      : float === 'right'
        ? 'float-right ml-5 mb-3'
        : 'mx-auto mb-4'

  const frameClasses = swing
    ? [
        'frame-swing',
        side === 'left' ? 'swing-left' : '',
        phase === 'hover' ? 'is-hover' : '',
        phase === 'release' ? 'is-releasing' : '',
      ]
        .filter(Boolean)
        .join(' ')
    : ''

  const onEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setSide(e.clientX < rect.left + rect.width / 2 ? 'left' : 'right')
    setPhase('hover')
  }

  return (
    <span
      className={`block ${widthClass} ${floatClass}`}
      onMouseEnter={swing ? onEnter : undefined}
      onMouseLeave={swing ? () => setPhase('release') : undefined}
    >
      <span
        className={`block relative ${frameClasses} ${hasMultiple ? 'cursor-pointer' : ''}`}
        style={{ aspectRatio: slideAspect }}
        onAnimationEnd={
          swing
            ? () => {
                if (phase === 'release') setPhase('rest')
              }
            : undefined
        }
        onClick={hasMultiple ? advance : undefined}
        onKeyDown={
          hasMultiple
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  advance()
                }
              }
            : undefined
        }
        role={hasMultiple ? 'button' : undefined}
        tabIndex={hasMultiple ? 0 : undefined}
        aria-label={
          hasMultiple
            ? `${current.alt || 'Photo'} — click to see next of ${effectiveSlides.length}`
            : undefined
        }
      >
        <span
          className="absolute overflow-hidden bg-[var(--tj-kraft)]/20"
          style={slideInset}
        >
          {current.src && (
            <img
              src={current.src}
              alt={current.alt}
              className={`w-full h-full ${current.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
              style={
                current.zoom || current.shiftY
                  ? {
                      transform: `translateY(${current.shiftY ?? '0'}) scale(${current.zoom ?? 1})`,
                    }
                  : undefined
              }
            />
          )}
        </span>
        <img
          src={`${BASE}decor/${slideFrame}`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        />
      </span>
      {current.caption && (
        <span className={`block text-center text-xs italic opacity-75 ${captionClass}`}>
          {current.caption}
        </span>
      )}
    </span>
  )
}

/* The birthday line — wraps its own text in a hover/tap trigger that
   mounts a fresh batch of confetti each time. burstId changes on every
   activation, which re-keys ConfettiBurst so React unmounts the old
   particles and remounts new ones (with new random angles/colors). */
function BirthdayGreeting() {
  const [burstId, setBurstId] = useState(0)
  const trigger = () => setBurstId((id) => id + 1)
  return (
    <span
      className="relative inline-block cursor-default"
      onMouseEnter={trigger}
      onClick={trigger}
    >
      Happy (belated) Birthday, Parker!
      {burstId > 0 && <ConfettiBurst key={burstId} />}
    </span>
  )
}

/* One burst of confetti — ~22 paper-strip particles fly outward from the
   text in random directions with random spin and a slight gravity bias,
   then fade. Particles are generated once on mount via useMemo so they
   don't re-randomize on re-render. */
const CONFETTI_COLORS = [
  '#a01c1c', // tj red
  '#e8b339', // gold
  '#3b6fa0', // blue
  '#d97a8a', // pink
  '#5fa05c', // green
  '#c8a878', // tj kraft (subtle on-brand)
]
function ConfettiBurst() {
  const particles = useMemo(() => {
    // Parametric heart: x = 16·sin³(t), y = -(13·cos(t) − 5·cos(2t) − 2·cos(3t) − cos(4t)).
    // Negating y flips math-up to screen-down. Natural curve spans roughly
    // ±16 wide and y ∈ [-5, 17]; scaling by 6 makes the heart about 192×132px.
    const COUNT = 48
    const SCALE = 6
    const NOISE = 8 // particle wobble off the curve so it reads as confetti, not a stencil
    return Array.from({ length: COUNT }, (_, i) => {
      // Even t with small jitter so particles aren't perfectly equidistant.
      const t = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.15
      const heartX = 16 * Math.pow(Math.sin(t), 3)
      const heartY = -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      )
      const dx = heartX * SCALE + (Math.random() - 0.5) * NOISE
      const dy = heartY * SCALE + (Math.random() - 0.5) * NOISE
      const rot = (Math.random() - 0.5) * 1080
      const w = 4 + Math.random() * 3
      const h = 8 + Math.random() * 4
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
      // Stagger start so the heart "draws itself" over the first ~200ms.
      const delay = Math.random() * 200
      // All particles spray from a single center point so they fan out
      // into the heart shape from one source.
      const originLeft = 50
      return { dx, dy, rot, w, h, color, delay, originLeft }
    })
  }, [])
  return (
    <span aria-hidden className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <span
          key={i}
          className="confetti-particle"
          style={
            {
              left: `${p.originLeft}%`,
              top: '50%',
              width: `${p.w}px`,
              height: `${p.h}px`,
              marginLeft: `${-p.w / 2}px`,
              marginTop: `${-p.h / 2}px`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              ['--dx' as string]: `${p.dx}px`,
              ['--dy' as string]: `${p.dy}px`,
              ['--rot' as string]: `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  )
}

/* The bazaar's hidden play button — earbud-style gestures on the red-dot logo.
   Single click = play/pause, double = skip ahead, triple = back a track.
   Play/pause talks to the YouTube embed via postMessage (enablejsapi=1) so a
   pause resumes from the same spot; skips remount the iframe for fresh
   autoplay. While playing, the dot spins slowly like a vinyl record. */
const CLICK_WINDOW_MS = 280

function BazaarSecret() {
  // null = nothing loaded yet. 0..N-1 = which track the iframe holds.
  const [trackIndex, setTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [chipVisible, setChipVisible] = useState(false)
  // Mobile browsers block autoplay of hidden iframes; on touch we show a chip instead.
  const [isTouchOnly, setIsTouchOnly] = useState(false)
  const [mobileNoteKey, setMobileNoteKey] = useState(0)
  const [mobileNoteVisible, setMobileNoteVisible] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<number | null>(null)
  // Mirror state into a ref so the deferred click dispatch reads fresh values.
  const stateRef = useRef({ trackIndex, isPlaying })
  stateRef.current = { trackIndex, isPlaying }

  const trackCount = BAZAAR_SECRET_TRACKS.length

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(pointer: coarse)')
    setIsTouchOnly(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsTouchOnly(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (trackIndex === null) {
      setChipVisible(false)
      return
    }
    setChipVisible(true)
    const t = setTimeout(() => setChipVisible(false), 3000)
    return () => clearTimeout(t)
  }, [trackIndex])

  useEffect(() => {
    if (mobileNoteKey === 0) return
    setMobileNoteVisible(true)
    const t = setTimeout(() => setMobileNoteVisible(false), 3000)
    return () => clearTimeout(t)
  }, [mobileNoteKey])

  useEffect(
    () => () => {
      if (clickTimerRef.current !== null) window.clearTimeout(clickTimerRef.current)
    },
    [],
  )

  const sendCommand = (func: 'playVideo' | 'pauseVideo') => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      'https://www.youtube.com',
    )
  }

  const togglePlay = () => {
    const { trackIndex: ti, isPlaying: playing } = stateRef.current
    if (ti === null) {
      // Nothing loaded — first press starts the playlist.
      setTrackIndex(0)
      setIsPlaying(true)
      return
    }
    sendCommand(playing ? 'pauseVideo' : 'playVideo')
    setIsPlaying(!playing)
  }

  const skip = (dir: 1 | -1) => {
    const { trackIndex: ti } = stateRef.current
    // From silence: forward lands on track 0, back wraps to the last track.
    const from = ti ?? (dir === 1 ? -1 : 0)
    setTrackIndex((from + dir + trackCount) % trackCount)
    setIsPlaying(true)
  }

  const handleClick = () => {
    if (isTouchOnly) {
      setMobileNoteKey((k) => k + 1)
      return
    }
    clickCountRef.current += 1
    if (clickTimerRef.current !== null) window.clearTimeout(clickTimerRef.current)
    clickTimerRef.current = window.setTimeout(() => {
      const count = clickCountRef.current
      clickCountRef.current = 0
      clickTimerRef.current = null
      if (count === 1) togglePlay()
      else if (count === 2) skip(1)
      else skip(-1)
    }, CLICK_WINDOW_MS)
  }

  const current = trackIndex !== null ? BAZAAR_SECRET_TRACKS[trackIndex] : null

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Music: click to play or pause, double-click to skip ahead, triple-click to go back"
        className="absolute left-1/2 top-[80%] -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      >
        <img
          src={redDotLogo}
          alt=""
          aria-hidden
          className={`h-12 md:h-14 w-auto select-none ${
            isPlaying
              ? 'animate-[spin_6s_linear_infinite]'
              : '-rotate-[8deg]'
          }`}
        />
      </button>
      {current && (
        <div
          aria-hidden
          className={`absolute left-1/2 top-[80%] -translate-x-1/2 translate-y-11 -rotate-[6deg] origin-center whitespace-nowrap font-[var(--tj-body)] tracking-[0.18em] text-[0.6rem] uppercase opacity-80 pointer-events-none transition-opacity duration-500 ${
            chipVisible ? 'opacity-80' : 'opacity-0'
          }`}
        >
          ♪ {current.title} · {current.artist}
        </div>
      )}
      {isTouchOnly && (
        <div
          aria-hidden
          className={`absolute left-1/2 top-[80%] -translate-x-1/2 translate-y-11 -rotate-[6deg] origin-center whitespace-nowrap font-[var(--tj-body)] tracking-[0.18em] text-[0.6rem] uppercase pointer-events-none transition-opacity duration-500 ${
            mobileNoteVisible ? 'opacity-80' : 'opacity-0'
          }`}
        >
          ♪ This playlist only spins on desktop
        </div>
      )}
      {current && (
        <iframe
          ref={iframeRef}
          key={trackIndex}
          title="Now playing"
          src={`https://www.youtube.com/embed/${current.id}?enablejsapi=1&autoplay=1${
            current.start ? `&start=${current.start}` : ''
          }`}
          allow="autoplay; encrypted-media"
          className="absolute w-0 h-0 border-0 -left-[9999px] pointer-events-none"
          aria-hidden
        />
      )}
    </>
  )
}

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-[var(--tj-red)]"
    >
      {children}
    </a>
  )
}

function FootnoteRef({ n, repeat = false }: { n: number; repeat?: boolean }) {
  return (
    <sup className="ml-0.5">
      <a
        id={repeat ? undefined : `noteref-${n}`}
        href={`#note-${n}`}
        className="font-[var(--tj-body)] tracking-[0.1em] text-[0.55rem] no-underline opacity-75 hover:text-[var(--tj-red)] hover:opacity-100 scroll-mt-24"
      >
        [{n}]
      </a>
    </sup>
  )
}

function Footnote({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li id={`note-${n}`} className="flex gap-2 scroll-mt-24">
      <a
        href={`#noteref-${n}`}
        aria-label={`Back to reference ${n}`}
        className="font-[var(--tj-body)] tracking-[0.15em] text-[0.55rem] uppercase shrink-0 mt-[0.15em] opacity-75 no-underline hover:text-[var(--tj-red)] hover:opacity-100"
      >
        [{n}]
      </a>
      <span>{children}</span>
    </li>
  )
}

