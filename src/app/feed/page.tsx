import Link from "next/link";
import { getFeed } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Feed — SignalMint",
  description: "News and drops from the SignalMint agent. Art cooked from market signals.",
};

export default async function FeedPage() {
  const events = await getFeed();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="section-container pt-16 pb-12 md:pt-24 md:pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-primaryText)] md:text-4xl">
          Feed
        </h1>
        <p className="mt-4 text-lg text-[var(--brand-primaryText)]/90">
          Drops and news. One event per box — art derived from market signals.
        </p>

        <div className="mt-12 space-y-6">
          {events.map((e) => (
            <div
              key={e.id}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-0 text-zinc-300 backdrop-blur-md transition-all hover:border-[var(--brand-accentOnBlue)]/30 hover:shadow-[0_0_20px_rgba(173,255,1,0.1)] group"
            >
              <div className="flex flex-col md:flex-row">
                {e.imageUri && (
                  <div className="md:w-56 flex-shrink-0 overflow-hidden border-r border-white/5">
                    <img
                      src={e.imageUri}
                      alt=""
                      className="h-40 w-full object-cover opacity-80 mix-blend-screen transition-all duration-700 group-hover:scale-110 group-hover:opacity-100 group-hover:mix-blend-normal md:h-full md:min-h-[160px]"
                    />
                  </div>
                )}
                <div className="flex-1 p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-accentOnBlue)] drop-shadow-[0_0_8px_rgba(173,255,1,0.5)]">{e.dropLabel}</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">{e.name}</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Cooked from: <span className="text-zinc-200">&quot;{e.cookedFrom}&quot;</span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300 line-clamp-2">
                    {e.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-5 text-sm">
                    {e.ctaUrl ? (
                      <Link
                        href={e.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-[var(--brand-accentOnBlue)]/50 bg-[var(--brand-accentOnBlue)]/10 px-4 py-1.5 font-bold text-[var(--brand-accentOnBlue)] transition-all hover:bg-[var(--brand-accentOnBlue)] hover:text-black hover:shadow-[0_0_15px_rgba(173,255,1,0.4)]"
                      >
                        {e.ctaLabel}
                      </Link>
                    ) : (
                      <span className="rounded-full bg-white/10 px-4 py-1.5 font-bold text-white">{e.ctaLabel}</span>
                    )}
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">{e.tokenLabel}</span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span> Source: {e.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
