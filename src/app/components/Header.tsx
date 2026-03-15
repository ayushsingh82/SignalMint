import Link from "next/link";

export function Header() {
  return (
    <header className="h-14 w-full border-b border-[var(--brand-primaryBg)] bg-[var(--brand-primaryBg)] md:h-16">
      <div className="section-container flex h-full items-center justify-between py-2">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[var(--brand-primaryText)] md:text-xl hover:opacity-90"
        >
          <span className="text-[var(--brand-accentOnBlue)]">Signal</span>Mint
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-[var(--brand-primaryText)]/90">
          <Link href="/mint" className="transition-colors hover:text-[var(--brand-accentOnBlue)]">
            Mint
          </Link>
          <Link href="/gallery" className="transition-colors hover:text-[var(--brand-accentOnBlue)]">
            Gallery
          </Link>
          <Link href="/request" className="transition-colors hover:text-[var(--brand-accentOnBlue)]">
            Request
          </Link>
        </nav>
      </div>
    </header>
  );
}
