import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl md:h-[4.5rem]">
      <div className="section-container flex h-full items-center justify-between py-2">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white md:text-xl transition-all hover:text-white/80"
        >
          <span className="text-[var(--brand-accentOnBlue)] drop-shadow-[0_0_10px_rgba(173,255,1,0.5)]">Signal</span>Mint
        </Link>
        <nav className="flex items-center gap-8 text-sm font-semibold uppercase tracking-wider text-zinc-300">
          <Link href="/gallery" className="transition-all hover:text-[var(--brand-accentOnBlue)] hover:drop-shadow-[0_0_8px_rgba(173,255,1,0.5)]">
            Gallery
          </Link>
          <Link href="/feed" className="transition-all hover:text-[var(--brand-accentOnBlue)] hover:drop-shadow-[0_0_8px_rgba(173,255,1,0.5)]">
            Feed
          </Link>
        </nav>
      </div>
    </header>
  );
}
