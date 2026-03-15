"use client";

import { useEffect, useState } from "react";
import type { MintRequest } from "@/lib/types";
import { getEventLabel, getStatusLabel } from "@/lib/requests";

export function RequestList() {
  const [requests, setRequests] = useState<MintRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/requests?limit=10");
      const data = await res.json();
      if (res.ok) setRequests(data.requests ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
    const handler = () => fetchRequests();
    window.addEventListener("request-list-refresh", handler);
    return () => window.removeEventListener("request-list-refresh", handler);
  }, []);

  if (loading) return <p className="text-sm text-[var(--brand-primaryText)]/60">Loading…</p>;
  if (requests.length === 0) return <p className="text-sm text-[var(--brand-primaryText)]/60">No requests yet. Submit one above.</p>;

  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-[var(--brand-accentOnBlue)]/20 px-2 py-0.5 text-xs font-medium text-[var(--brand-accentOnBlue)]">{getEventLabel(r.eventType)}</span>
            <span className="text-xs font-medium text-[var(--brand-primaryText)]/70">{getStatusLabel(r.status)}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--brand-primaryText)]/90 line-clamp-2">{r.description}</p>
          {r.triggerCondition && <p className="mt-1 text-xs text-[var(--brand-primaryText)]/60">Trigger: {r.triggerCondition}</p>}
          <p className="mt-2 font-mono text-xs text-[var(--brand-primaryText)]/50">{r.id} · {new Date(r.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
