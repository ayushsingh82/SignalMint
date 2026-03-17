import Link from "next/link";

export function Header() {
  return (
    <header className="h-16 w-full border-b border-[var(--brand-primaryBg)] bg-[var(--brand-primaryBg)] md:h-[4.5rem]">
      <div className="section-container flex h-full items-center justify-between py-2">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[var(--brand-primaryText)] md:text-xl hover:opacity-90"
        >
          <span className="text-[var(--brand-accentOnBlue)]">Signal</span>Mint
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-[var(--brand-primaryText)]/90">
          <Link href="/gallery" className="transition-colors hover:text-[var(--brand-accentOnBlue)]">
            Gallery
          </Link>
          <Link href="/feed" className="transition-colors hover:text-[var(--brand-accentOnBlue)]">
            Feed
          </Link>
        </nav>
      </div>
    </header>
  );
}
