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
            <div key={item.id} className="border-2 border-[var(--brand-primaryText)]/20 bg-white p-0 text-[var(--brand-textPrimary)]">
              {item.imageUri ? (
                <img
                  src={item.imageUri}
                  alt={item.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full bg-[var(--brand-primaryBg)]/10 flex items-center justify-center text-[var(--brand-textPrimary)]/50 text-sm">
                  Art
                </div>
              )}
              <div className="p-4">
                <p className="text-xs text-[var(--brand-textPrimary)]/60">
                  {item.mintedAt ? new Date(item.mintedAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                </p>
                <h3 className="mt-1 font-semibold text-[var(--brand-textPrimary)]">{item.name}</h3>
                <p className="mt-1 text-xs text-[var(--brand-textPrimary)]/70">From market signal: {item.signal}</p>
                <p className="mt-2 text-xs font-medium text-[var(--brand-textAccent)]">{statusLabel(item.status)}</p>
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
