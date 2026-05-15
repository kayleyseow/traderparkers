import { Link } from 'react-router'
import TopNav from '../TopNav'
import Footer from '../Footer'

export default function About() {
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

        <article className="space-y-12 text-base leading-relaxed font-serif">

          <Section label="The Story">
            <p>
              {/* TODO: rewrite this in your own voice */}
              This site started as a birthday present. Somewhere along the way, my
              friend Parker started accidentally collecting Trader Joe's reusable
              tote bags — the kind they release in seasonal designs and
              state-themed runs. One bag became three, three became a stack on the
              shelf, and somewhere around bag number eight it stopped being
              "groceries" and started being a pantry.
            </p>
            <p>
              The idea here was simple: build her a place to actually
              <em> see </em> the pantry. Photos, the memory of which store
              each one came from, and a way to feel that quiet satisfaction of
              checking another state off the list.
            </p>
          </Section>

          <Divider />

          <Section label="About Parker">
            <p>
              {/* TODO: add details about Parker here.
                  Also write a section about Parker & Kayley's favorite TJ's
                  products. Examples to weave in:
                    - Parker: red lentil pasta ("for the protien")
                    - Parker: greek yogurt
                    - Kayley: (add own favorites)
                  Could live inside this "About Parker" section or get its own
                  "A Few Favorites" section between this and Credits. */}
              Parker is the kind of person who treats a Trader Joe's run like a
              minor expedition. She remembers which store had the good seasonal
              cards. She has opinions on every flavor of frozen mochi. And she has
              a small, growing army of tote bags, each with a story behind it.
            </p>
            <p>
              This site is her archive — built so that one day, when the
              pantry is complete or close to it, she can scroll through and
              see all of it laid out together.
            </p>
          </Section>

          <Divider />

          <Section label="Credits & Thanks">
            <ul className="space-y-3 list-none p-0">
              <CreditRow
                title="Trader Joe's Font"
                detail={
                  <>
                    by Fontopia (CC BY-NC) —{' '}
                    <a
                      href="https://www.fontspace.com/trader-joes-font-f34830"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-[var(--tj-red)]"
                    >
                      Fontspace
                    </a>
                  </>
                }
              />
              <CreditRow
                title="Store Locations"
                detail={
                  <>
                    scraped from{' '}
                    <a
                      href="https://locations.traderjoes.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-[var(--tj-red)]"
                    >
                      locations.traderjoes.com
                    </a>{' '}
                    (thanks for the clean sitemap)
                  </>
                }
              />
              <CreditRow
                title="Built With"
                detail="React, Vite, TypeScript, Tailwind, and a lot of love for a particular grocery store"
              />
              <CreditRow
                title="Hosted On"
                detail="GitHub Pages"
              />
            </ul>
          </Section>

          <Divider />

          <Section label="A Note">
            <p className="italic">
              Trader Joe's, the wordmark, and the visual style being lovingly
              imitated here all belong to Trader Joe's Company. This site is a
              personal, non-commercial fan project, made for one specific person
              who happens to really like their bags.
            </p>
          </Section>
        </article>

        <footer className="mt-16 text-center">
          <Link
            to="/pantry"
            className="inline-block font-[var(--tj-body)] tracking-[0.25em] text-xs uppercase border-2 border-[var(--tj-ink)] bg-[var(--tj-ink)] text-[var(--tj-cream)] px-6 py-3 hover:bg-transparent hover:text-[var(--tj-ink)] transition-colors"
          >
            See the Pantry
          </Link>
        </footer>

        </div>
      </div>
      <Footer />
    </main>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-[var(--tj-body)] tracking-[0.3em] text-[0.7rem] uppercase mb-4 flex items-center gap-3 before:content-[''] before:h-px before:flex-1 before:bg-[var(--tj-ink)]/30 after:content-[''] after:h-px after:flex-1 after:bg-[var(--tj-ink)]/30">
        {label}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function CreditRow({ title, detail }: { title: string; detail: React.ReactNode }) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="font-[var(--tj-body)] tracking-[0.2em] text-[0.65rem] uppercase shrink-0 opacity-75">
        {title}
      </span>
      <span className="text-sm">{detail}</span>
    </li>
  )
}

function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 opacity-40">
      <span className="h-px w-12 bg-[var(--tj-ink)]" />
      <span className="text-[var(--tj-red)] text-lg">✦</span>
      <span className="h-px w-12 bg-[var(--tj-ink)]" />
    </div>
  )
}
