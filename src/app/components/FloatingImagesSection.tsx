"use client";

import Link from "next/link";

export function FloatingImagesSection() {
  const sponsors = [
    {
      name: "Rare Protocol",
      description: "Onchain mint execution, token creation, and explorer-verifiable transaction receipts.",
    },
    {
      name: "OpenServ",
      description: "External workflow triggers and observable orchestration for agent-to-agent runtime events.",
    },
    {
      name: "Zyfai",
      description:
        "Safe-wallet and session-key operations for persistent autonomous execution without manual signing loops.",
    },
    {
      name: "Uniswap",
      description:
        "Live pricing and liquidity context in Scout/Analyst to improve decision quality and confidence checks.",
    },
    {
      name: "Filecoin + Pinata/IPFS",
      description:
        "Persistent storage for generated media, metadata, and execution logs used as tamper-resistant evidence.",
    },
    {
      name: "ERC-8004",
      description:
        "Explicit agent identity linkage for trustworthy attribution of actions and receipts across runtime cycles.",
    },
  ];

  return (
    <>
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
            <p className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-zinc-400 md:text-xl font-medium">
              SignalMint is a live, autonomous multi-agent pipeline. Scout collects market context, Analyst scores confidence,
              Executor mints onchain via Rare Protocol, and Verifier publishes receipts to IPFS. Every cycle is logged, replayable,
              and auditable so judges can inspect outcomes, not just prompts.
            </p>
            <div className="pointer-events-auto mx-auto mt-8 max-w-4xl">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500"></p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {sponsors.map((s) => (
                  <div key={s.name} className="group relative">
                    <div className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm font-semibold text-zinc-200 transition-all hover:border-[var(--brand-accentOnBlue)] hover:text-[var(--brand-accentOnBlue)]">
                      {s.name}
                    </div>
                    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-black/95 p-3 text-left text-xs leading-relaxed text-zinc-300 opacity-0 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-opacity duration-150 group-hover:opacity-100">
                      {s.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
    </>
  );
}
