import Link from "next/link";
import { getMints } from "@/lib/data";

export default async function Home() {
  const { mints } = await getMints();
  const featured = mints.slice(0, 8);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero */}
      <section className="section-container pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--brand-accentOnBlue)]/90">
          Autonomous art agent
        </p>
        <h1 className="mx-auto mt-4 max-w-5xl text-4xl font-bold tracking-tight text-[var(--brand-primaryText)] sm:text-5xl md:text-6xl lg:text-7xl">
          Art shaped by{" "}
          <span className="text-[var(--brand-accentOnBlue)]">market signals</span>
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[var(--brand-primaryText)]/90 sm:text-xl">
          Each NFT is triggered by live auction activity. High bids, whale moves, bidding velocity — the market drives the art.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/mint"
            className="btn-primary-on-blue px-6 py-3 text-sm font-semibold transition-colors"
          >
            How minting works
          </Link>
          <Link
            href="/gallery"
            className="border-2 border-[var(--brand-primaryText)] bg-transparent px-6 py-3 text-sm font-semibold text-[var(--brand-primaryText)] transition-colors hover:bg-white/10"
          >
            View gallery
          </Link>
          <Link
            href="/request"
            className="border-2 border-[var(--brand-accentOnBlue)]/50 bg-[var(--brand-accentOnBlue)]/10 px-6 py-3 text-sm font-semibold text-[var(--brand-accentOnBlue)] transition-colors hover:bg-[var(--brand-accentOnBlue)]/20"
          >
            Request a mint
          </Link>
        </div>
      </section>

      {/* NFTs + market triggers — scroll section */}
      <section className="border-t border-white/20 bg-[var(--background)] py-16 md:py-24" id="mints">
        <div className="section-container">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--brand-primaryText)] md:text-3xl">
              Signal → Art
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--brand-primaryText)]/80 md:text-lg">
              Every mint is triggered by a market event. Scroll to see how auction activity becomes artwork.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-shadow hover:shadow-xl hover:shadow-black/10"
              >
                <div className="aspect-square w-full overflow-hidden bg-[var(--brand-primaryBg)]/10">
                  {item.imageUri ? (
                    <img
                      src={item.imageUri}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--brand-primaryText)]/40 text-sm">
                      Art
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="font-semibold text-[var(--brand-primaryText)] md:text-lg">
                    {item.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--brand-accentOnBlue)]/20 px-2.5 py-1 text-xs font-medium text-[var(--brand-accentOnBlue)]">
                      Triggered by
                    </span>
                    <span className="text-sm font-medium text-[var(--brand-primaryText)]/90">
                      {item.signal}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--brand-primaryText)]/60">
                    {item.signal === "High bids" && "Artwork complexity increases with bid pressure."}
                    {item.signal === "Many bidders" && "Colors and composition shift with participation."}
                    {item.signal === "Whale bid" && "New series or variant spawned by large bid."}
                    {item.signal === "Slow auction" && "Artwork reflects calmer, degraded state."}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-accentOnBlue)] hover:underline"
            >
              View all mints
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — one-liner + CTA */}
      <section className="border-t border-white/20 bg-[var(--background)] py-14 md:py-20">
        <div className="section-container">
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center md:p-10">
            <h2 className="text-xl font-bold tracking-tight text-[var(--brand-primaryText)] md:text-2xl">
              <span className="text-[var(--brand-accentOnBlue)]">Signal</span>Mint
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--brand-primaryText)]/90 md:text-base">
              Autonomous market-driven art agent. Protocol Labs (Let the Agent Cook) + SuperRare (Rare Protocol). 
              Rare CLI, ERC-8004, agent.json, agent_log.json.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/mint"
                className="rounded-lg border-2 border-[var(--brand-primaryText)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--brand-primaryText)] transition-colors hover:bg-white/10"
              >
                Mint flow
              </Link>
              <Link
                href="/gallery"
                className="rounded-lg bg-[var(--brand-accentOnBlue)] px-4 py-2 text-sm font-semibold text-[var(--brand-primaryBg)] transition-opacity hover:opacity-90"
              >
                Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
