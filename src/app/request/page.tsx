import { RequestForm } from "./RequestForm";
import { RequestList } from "./RequestList";

export const metadata = {
  title: "Request a mint — SignalMint",
  description: "Ask the agent to mint an NFT from a market event.",
};

export default function RequestPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="section-container pt-16 pb-12 md:pt-24 md:pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-primaryText)] md:text-4xl">Request a mint</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--brand-primaryText)]/90">
          Tell the agent what market event should trigger an NFT. When the market matches, the agent mints on Rare Protocol.
        </p>
        <div className="mt-12 grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-[var(--brand-primaryText)]">New request</h2>
              <div className="mt-6">
                <RequestForm />
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-[var(--brand-primaryText)]">Recent requests</h2>
              <div className="mt-6"><RequestList /></div>
            </div>
          </div>
        </div>
        <div className="mt-14 rounded-xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h3 className="font-semibold text-[var(--brand-primaryText)]">How it works</h3>
          <ul className="mt-4 space-y-2 text-sm text-[var(--brand-primaryText)]/90">
            <li>• Submit event type + description + optional trigger. Agent runs discover → plan → execute → verify → submit.</li>
            <li>• When the market matches, the agent mints. NFTs appear in the <a href="/gallery" className="text-[var(--brand-accentOnBlue)] hover:underline">Gallery</a>.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
