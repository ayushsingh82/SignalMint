"use client";

import { useState } from "react";
import type { RequestEventType } from "@/lib/types";

const EVENT_OPTIONS: { value: RequestEventType; label: string }[] = [
  { value: "high_bids", label: "High bids" },
  { value: "whale_bid", label: "Whale bid" },
  { value: "many_bidders", label: "Many bidders" },
  { value: "slow_auction", label: "Slow auction" },
  { value: "sports_outcome", label: "Sports outcome" },
  { value: "news_event", label: "News event" },
  { value: "prediction_market", label: "Prediction market" },
  { value: "custom", label: "Custom" },
];

export function RequestForm() {
  const [eventType, setEventType] = useState<RequestEventType>("high_bids");
  const [description, setDescription] = useState("");
  const [triggerCondition, setTriggerCondition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          description: description.trim(),
          triggerCondition: triggerCondition.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit");
        return;
      }
      setSubmitted({ id: data.request.id });
      setDescription("");
      setTriggerCondition("");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("request-list-refresh"));
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--brand-accentOnBlue)]/40 bg-[var(--brand-accentOnBlue)]/10 p-6 text-center">
        <p className="text-lg font-semibold text-[var(--brand-primaryText)]">
          Request sent to the agent
        </p>
        <p className="mt-2 text-sm text-[var(--brand-primaryText)]/80">
          The agent will mint an NFT when the market event matches your request.
        </p>
        <p className="mt-3 font-mono text-xs text-[var(--brand-accentOnBlue)]">
          ID: {submitted.id}
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(null)}
          className="mt-4 text-sm font-medium text-[var(--brand-accentOnBlue)] hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="eventType" className="block text-sm font-medium text-[var(--brand-primaryText)]">
          Market event type
        </label>
        <select
          id="eventType"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as RequestEventType)}
          className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-[var(--brand-primaryText)] focus:border-[var(--brand-accentOnBlue)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-accentOnBlue)]"
          required
        >
          {EVENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-[var(--brand-primaryText)]">
          What should the agent mint? *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Create art when a whale bid lands on the current Rare auction, or when ETH price moves 5% in an hour..."
          rows={4}
          className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-[var(--brand-primaryText)] placeholder:text-[var(--brand-primaryText)]/50 focus:border-[var(--brand-accentOnBlue)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-accentOnBlue)]"
          required
        />
      </div>

      <div>
        <label htmlFor="triggerCondition" className="block text-sm font-medium text-[var(--brand-primaryText)]">
          Trigger condition (optional)
        </label>
        <input
          id="triggerCondition"
          type="text"
          value={triggerCondition}
          onChange={(e) => setTriggerCondition(e.target.value)}
          placeholder="e.g. When volume > 1 ETH, or when auction has 10+ bidders"
          className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-[var(--brand-primaryText)] placeholder:text-[var(--brand-primaryText)]/50 focus:border-[var(--brand-accentOnBlue)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-accentOnBlue)]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary-on-blue w-full rounded-lg px-6 py-3 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Request mint from agent"}
      </button>
    </form>
  );
}
