import Link from "next/link";
import { getFeed } from "@/lib/data";

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
              className="border-2 border-[var(--brand-primaryText)]/20 bg-white p-0 text-[var(--brand-textPrimary)]"
            >
              <div className="flex flex-col md:flex-row">
                {e.imageUri && (
                  <div className="md:w-48 flex-shrink-0">
                    <img
                      src={e.imageUri}
                      alt=""
                      className="h-32 w-full object-cover md:h-auto md:min-h-[140px]"
                    />
                  </div>
                )}
                <div className="flex-1 p-5">
                  <p className="text-xs font-medium text-[var(--brand-textAccent)]">{e.dropLabel}</p>
                  <h2 className="mt-1 text-xl font-bold text-[var(--brand-textPrimary)]">{e.name}</h2>
                  <p className="mt-2 text-sm text-[var(--brand-textPrimary)]/80">
                    Cooked from: &quot;{e.cookedFrom}&quot;
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--brand-textPrimary)]/90 line-clamp-2">
                    {e.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    {e.ctaUrl ? (
                      <Link
                        href={e.ctaUrl}
                        className="font-semibold text-[var(--brand-textAccent)] hover:underline"
                      >
                        {e.ctaLabel}
                      </Link>
                    ) : (
                      <span className="font-semibold text-[var(--brand-textAccent)]">{e.ctaLabel}</span>
                    )}
                    <span className="text-[var(--brand-textPrimary)]/70">{e.tokenLabel}</span>
                    <span className="text-[var(--brand-textPrimary)]/60">Source: {e.source}</span>
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
