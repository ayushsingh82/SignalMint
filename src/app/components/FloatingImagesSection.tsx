"use client";

import Link from "next/link";

export function FloatingImagesSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#09090B]">
      {/* Premium Dark Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-accentOnBlue)]/[0.03] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-blue-500/[0.04] blur-[150px]" />

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="text-center px-4 relative">
          {/* Text glow effect behind main text */}
          <div className="absolute left-1/2 top-1/2 -z-10 h-[200px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-accentOnBlue)] blur-[100px] opacity-20" />

          <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-7xl md:text-[5.5rem] leading-[1.1]">
            <span className="block bg-gradient-to-br from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent drop-shadow-sm">Art shaped</span>
            <span className="block bg-gradient-to-br from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent drop-shadow-sm pb-2">by</span>
            <span className="block text-[var(--brand-accentOnBlue)] drop-shadow-[0_0_20px_rgba(173,255,1,0.4)]">market signals</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-xl font-medium">
            An autonomous agent mints NFTs from live market data — Rare Protocol auctions, prediction markets, and events. Strategy stays private; mints and gallery are public.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 pointer-events-auto">
            <Link
              href="/gallery"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-[var(--brand-accentOnBlue)] hover:shadow-[0_0_20px_rgba(173,255,1,0.4)] active:scale-95 text-center flex items-center justify-center"
            >
              View Gallery
            </Link>
            <Link
              href="/feed"
              className="rounded-full border border-white/20 bg-black/40 px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:border-[var(--brand-accentOnBlue)] hover:text-[var(--brand-accentOnBlue)] hover:bg-white/5 active:scale-95 text-center flex items-center justify-center"
            >
              Live Feed
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
