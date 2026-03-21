import { getMints } from "@/lib/data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gallery — SignalMint",
  description: "Minted NFTs from the SignalMint agent.",
};

type GalleryPageProps = {
  searchParams?: Promise<{ page?: string }> | { page?: string };
};

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const { mints, total } = await getMints();
  const resolvedParams =
    searchParams && typeof (searchParams as Promise<{ page?: string }>).then === "function"
      ? await (searchParams as Promise<{ page?: string }>)
      : ((searchParams as { page?: string } | undefined) ?? {});
  const requestedPage = Number(resolvedParams.page || "1");
  const pageSize = 16; // 4 rows × 4 cards on desktop
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(1, Math.trunc(requestedPage)), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const pagedMints = mints.slice(start, start + pageSize);
  const envIdentityId = process.env.ERC8004_AGENT_ID?.trim();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="section-container pt-16 pb-12 md:pt-24 md:pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-primaryText)] md:text-4xl">
          Gallery
        </h1>
        <p className="mt-4 text-lg text-[var(--brand-primaryText)]/90">
          NFTs minted by the <span className="text-[var(--brand-accentOnBlue)]">SignalMint</span> agent.
        </p>

        <p className="mt-2 text-sm text-[var(--brand-primaryText)]/70">
          {total} mint{total !== 1 ? "s" : ""} (newest first) · Page {currentPage} of {totalPages}
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
            {pagedMints.map((item) => (
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
                  {item.identityId || envIdentityId ? (
                    <p className="mt-2 rounded-md border border-white/15 bg-black/35 px-2 py-1 text-[10px] font-mono text-zinc-300">
                      ERC8004 Identity #{item.identityId ?? envIdentityId}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-accentOnBlue)]">
                      Minted
                    </p>
                    <span className="flex h-2 w-2 rounded-full bg-[var(--brand-accentOnBlue)] shadow-[0_0_8px_rgba(173,255,1,1)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-2 text-sm">
            <Link
              href={`/gallery?page=${Math.max(1, currentPage - 1)}`}
              className={`rounded-md border px-3 py-1.5 ${
                currentPage <= 1
                  ? "pointer-events-none border-white/10 text-zinc-500"
                  : "border-white/20 text-white hover:border-[var(--brand-accentOnBlue)]"
              }`}
            >
              Prev
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/gallery?page=${p}`}
                className={`rounded-md border px-3 py-1.5 ${
                  p === currentPage
                    ? "border-[var(--brand-accentOnBlue)] bg-[var(--brand-accentOnBlue)]/20 text-[var(--brand-accentOnBlue)]"
                    : "border-white/20 text-white hover:border-[var(--brand-accentOnBlue)]"
                }`}
              >
                {p}
              </Link>
            ))}
            <Link
              href={`/gallery?page=${Math.min(totalPages, currentPage + 1)}`}
              className={`rounded-md border px-3 py-1.5 ${
                currentPage >= totalPages
                  ? "pointer-events-none border-white/10 text-zinc-500"
                  : "border-white/20 text-white hover:border-[var(--brand-accentOnBlue)]"
              }`}
            >
              Next
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
