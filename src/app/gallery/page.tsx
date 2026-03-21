import { getMints } from "@/lib/data";
import type { MintStatus } from "@/lib/types";

export const metadata = {
  title: "Gallery — SignalMint",
  description: "Minted NFTs from the SignalMint agent.",
};

function statusLabel(s: MintStatus): string {
  return s === "minted" ? "Minted" : s === "auction" ? "Auction" : "Pending";
}

export default async function GalleryPage() {
  const { mints, total } = await getMints();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="section-container pt-16 pb-12 md:pt-24 md:pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-primaryText)] md:text-4xl">
          Gallery
        </h1>
        <p className="mt-4 text-lg text-[var(--brand-primaryText)]/90">
          NFTs minted by the <span className="text-[var(--brand-accentOnBlue)]">SignalMint</span> agent. Art shaped by market signals.
        </p>

        <p className="mt-2 text-sm text-[var(--brand-primaryText)]/70">
          {total} Rare mint{total !== 1 ? "s" : ""} (newest first)
          {mints[0]?.protocol === "rare" ? ", artwork from on-chain metadata (IPFS)" : ""}
        </p>

        {total === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-black/30 p-10 text-center text-[var(--brand-primaryText)]/80">
            <p className="text-lg font-medium text-white">No Rare mints in logs yet</p>
            <p className="mt-2 text-sm">
              Run the agent so <code className="rounded bg-white/10 px-1 font-mono text-xs">logs/agent_log_*.json</code>{" "}
              records successful <code className="rounded bg-white/10 px-1 font-mono text-xs">MINT_NFT</code>{" "}
              executions, then refresh. Or set <code className="rounded bg-white/10 px-1 font-mono text-xs">GALLERY_USE_MOCK_MINTS=true</code>{" "}
              for demo tiles.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mints.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md transition-all hover:border-[var(--brand-accentOnBlue)]/50 hover:shadow-[0_0_30px_rgba(173,255,1,0.15)] group"
              >
                {item.imageUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUri}
                    alt={item.name}
                    className="aspect-square w-full object-cover opacity-80 mix-blend-screen transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:mix-blend-normal"
                  />
                ) : (
                  <div className="aspect-square w-full bg-white/5 flex items-center justify-center text-zinc-500 text-sm">
                    Loading IPFS image…
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs text-zinc-400">
                    {item.mintedAt
                      ? new Date(item.mintedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-white">{item.name}</h3>
                  {item.tokenId ? (
                    <p className="mt-1 text-xs font-mono text-zinc-500">Token #{item.tokenId}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-zinc-300">
                    Signal: <span className="text-[var(--brand-accentOnBlue)]">{item.signal}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {item.explorerUrl ? (
                      <a
                        href={item.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--brand-accentOnBlue)] underline-offset-2 hover:underline"
                      >
                        NFT on explorer
                      </a>
                    ) : null}
                    {item.txExplorerUrl ? (
                      <a
                        href={item.txExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
                      >
                        Mint tx
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-accentOnBlue)]">
                      {item.protocol === "rare" ? "Rare" : statusLabel(item.status)}
                    </p>
                    <span className="flex h-2 w-2 rounded-full bg-[var(--brand-accentOnBlue)] shadow-[0_0_8px_rgba(173,255,1,1)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
