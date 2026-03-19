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
          {total} mint{total !== 1 ? "s" : ""}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mints.map((item) => (
            <div key={item.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md transition-all hover:border-[var(--brand-accentOnBlue)]/50 hover:shadow-[0_0_30px_rgba(173,255,1,0.15)] group">
              {item.imageUri ? (
                <img
                  src={item.imageUri}
                  alt={item.name}
                  className="aspect-square w-full object-cover opacity-80 mix-blend-screen transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:mix-blend-normal"
                />
              ) : (
                <div className="aspect-square w-full bg-white/5 flex items-center justify-center text-zinc-500 text-sm">
                  Art
                </div>
              )}
              <div className="p-5">
                <p className="text-xs text-zinc-400">
                  {item.mintedAt ? new Date(item.mintedAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                </p>
                <h3 className="mt-2 text-lg font-bold text-white">{item.name}</h3>
                <p className="mt-1 text-xs text-zinc-300">From market signal: <span className="text-[var(--brand-accentOnBlue)]">{item.signal}</span></p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-accentOnBlue)]">{statusLabel(item.status)}</p>
                  <span className="flex h-2 w-2 rounded-full bg-[var(--brand-accentOnBlue)] shadow-[0_0_8px_rgba(173,255,1,1)]"></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-[var(--brand-primaryText)]/80">
          Data from <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-xs">/api/mints</code>. Connect to Rare Protocol to show live mints.
        </p>
      </section>
    </div>
  );
}
