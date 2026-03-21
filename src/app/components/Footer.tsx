import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--brand-primaryBg)] bg-[var(--brand-primaryBg)] py-6 md:py-8">
      <div className="section-container flex flex-col items-center justify-between gap-4 text-sm text-[var(--brand-primaryText)]/90 md:flex-row">
        <Link href="/" className="font-medium text-[var(--brand-primaryText)] hover:opacity-90">
          <span className="text-[var(--brand-accentOnBlue)]">Signal</span>Mint
        </Link>
      </div>
    </footer>
  );
}
