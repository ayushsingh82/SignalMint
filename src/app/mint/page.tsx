import Link from "next/link";
import { getSignals } from "@/lib/data";

export const metadata = {
  title: "Mint — SignalMint",
  description: "How NFT minting works: market signals → art → mint on Rare Protocol.",
};

export default async function MintPage() {
  const { signals, updatedAt } = await getSignals();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="section-container pt-16 pb-12 md:pt-24 md:pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-primaryText)] md:text-4xl">
          How minting works
        </h1>
        <p className="mt-4 text-lg text-[var(--brand-primaryText)]/90 max-w-4xl">
          The agent reads <span className="text-[var(--brand-accentOnBlue)]">market signals</span> — Rare auctions, prediction-market events (e.g. Polymarket-style), sports, news — and mints on Rare Protocol. Private strategy; public art.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="card-subtle">
            <h2 className="text-base font-semibold uppercase tracking-wide text-[var(--brand-textPrimary)] md:text-lg">
              Live signals
            </h2>
            <p className="mt-1 text-xs text-[var(--brand-textPrimary)]/60">
              Current market inputs (from <code className="rounded bg-black/5 px-1 py-0.5 font-mono">/api/signals</code>). Updated: {new Date(updatedAt).toLocaleTimeString()}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--brand-textPrimary)]/90 md:text-base">
              {signals.map((s) => (
                <li key={s.id} className="flex justify-between gap-4 border-b border-black/5 pb-2 last:border-0">
                  <span>{s.label}</span>
                  <span className="font-medium text-[var(--brand-textAccent)]">
                    {typeof s.value === "number" ? s.value : s.value} {s.unit ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-subtle lg:col-span-1">
            <h2 className="text-base font-semibold uppercase tracking-wide text-[var(--brand-textPrimary)] md:text-lg">
              Mint flow
            </h2>
            <ol className="mt-4 flex flex-col gap-4 text-sm text-[var(--brand-textPrimary)]/90 md:text-base">
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primaryBg)] text-xs font-bold text-[var(--brand-primaryText)]">1</span>
                <span><strong>Market</strong> — Agent monitors Rare auctions (bids, bidders, speed).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primaryBg)] text-xs font-bold text-[var(--brand-primaryText)]">2</span>
                <span><strong>Art</strong> — Artwork is generated from those signals (complexity, colors, series).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primaryBg)] text-xs font-bold text-[var(--brand-primaryText)]">3</span>
                <span><strong>IPFS</strong> — Art is pinned; CID is used for the token metadata.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primaryBg)] text-xs font-bold text-[var(--brand-primaryText)]">4</span>
                <span><strong>Mint</strong> — Rare CLI mints the NFT (ERC-721) and creates the auction.</span>
              </li>
            </ol>
          </div>

          <div className="card-subtle lg:col-span-2">
            <h2 className="text-base font-semibold uppercase tracking-wide text-[var(--brand-textPrimary)] md:text-lg">
              Where mints show up
            </h2>
            <p className="mt-4 text-sm text-[var(--brand-textPrimary)]/90 md:text-base">
              Every mint appears in the <Link href="/gallery" className="text-[var(--brand-textAccent)] font-medium hover:underline">Gallery</Link>. You can also view them on-chain via Rare Protocol and the contract address.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
