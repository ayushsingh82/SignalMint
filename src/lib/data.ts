/**
 * Data layer for SignalMint.
 * Gallery: Rare Protocol mints from agent logs (latest first) + IPFS image via metadata.
 */

import type { Mint, MarketSignal, MintsResponse, SignalsResponse, FeedEvent } from "./types";
import { getRareMintsFromAgentLogs } from "./rare-mints";

// Images: trading, prediction markets, sports, news (Unsplash, free to use)
// Trading/charts: 1579621970563-ebec7560ff52, 1590283603385-17ffb3a7f29f | Sports: 1461896836934-5f5655182d4e, 1574629810360-7efbbe195018 | News: 1495020689067-958852a7765e, 1504711434969-e33886168f5c
const MOCK_MINTS: Mint[] = [
  {
    id: "1",
    protocol: "mock",
    name: "Chaos Index",
    signal: "High bids",
    status: "minted",
    imageUri: "https://images.unsplash.com/photo-1579621970563-ebec7560ff52?w=600&h=600&fit=crop",
    mintedAt: "2025-03-01T12:00:00Z",
  },
  {
    id: "2",
    name: "Bid Velocity",
    signal: "Many bidders",
    status: "minted",
    imageUri: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=600&fit=crop",
    mintedAt: "2025-03-02T14:30:00Z",
  },
  {
    id: "3",
    name: "Whale Shadow",
    signal: "Whale bid",
    status: "auction",
    imageUri: "https://images.unsplash.com/photo-1579621970563-ebec7560ff52?w=600&h=600&fit=crop",
    mintedAt: "2025-03-03T09:15:00Z",
  },
  {
    id: "4",
    name: "Slow Burn",
    signal: "Slow auction",
    status: "minted",
    imageUri: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=600&fit=crop",
    mintedAt: "2025-03-04T16:45:00Z",
  },
  {
    id: "5",
    name: "Pulse Wave",
    signal: "High bids",
    status: "minted",
    imageUri: "https://images.unsplash.com/photo-1461896836934-5f5655182d4e?w=600&h=600&fit=crop",
    mintedAt: "2025-03-05T08:20:00Z",
  },
  {
    id: "6",
    name: "Market Fractal",
    signal: "Many bidders",
    status: "minted",
    imageUri: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&h=600&fit=crop",
    mintedAt: "2025-03-06T11:00:00Z",
  },
  {
    id: "7",
    name: "Signal Drift",
    signal: "Whale bid",
    status: "auction",
    imageUri: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=600&fit=crop",
    mintedAt: "2025-03-07T15:30:00Z",
  },
  {
    id: "8",
    name: "Auction Echo",
    signal: "High bids",
    status: "minted",
    imageUri: "https://images.unsplash.com/photo-1461896836934-5f5655182d4e?w=600&h=600&fit=crop",
    mintedAt: "2025-03-08T09:45:00Z",
  },
  {
    id: "9",
    name: "Liquidity Pulse",
    signal: "Many bidders",
    status: "minted",
    imageUri: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=600&fit=crop",
    mintedAt: "2025-03-09T13:10:00Z",
  },
  {
    id: "10",
    name: "Depth Chart",
    signal: "Slow auction",
    status: "pending",
    imageUri: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&h=600&fit=crop",
    mintedAt: "2025-03-10T10:00:00Z",
  },
];

/**
 * Fetch mints for the gallery: only Rare mints from `logs/agent_log_*.json`, newest first.
 * Resolves token metadata JSON from IPFS (or gatewayUrl in logs) to set `imageUri`.
 * Set GALLERY_USE_MOCK_MINTS=true to use placeholder Unsplash tiles instead.
 */
export async function getMints(): Promise<MintsResponse> {
  if (process.env.GALLERY_USE_MOCK_MINTS === "true") {
    await Promise.resolve();
    return {
      mints: MOCK_MINTS.map((m) => ({ ...m })),
      total: MOCK_MINTS.length,
    };
  }

  const mints = await getRareMintsFromAgentLogs({
    limit: Number(process.env.GALLERY_RARE_MINT_LIMIT || 48),
  });

  return {
    mints,
    total: mints.length,
  };
}

/**
 * Fetch current market signals that drive the agent's art.
 * TODO: Replace with chain/subgraph data (auction counts, bid volumes, etc.).
 */
export async function getSignals(): Promise<SignalsResponse> {
  await Promise.resolve();
  const signals: MarketSignal[] = [
    { id: "1", label: "Active auctions", value: 12, kind: "auction_count", unit: "" },
    { id: "2", label: "Avg bid count", value: 4.2, kind: "bidders_count", unit: "" },
    { id: "3", label: "Last 24h volume", value: "0.42", kind: "volume", unit: "ETH" },
    { id: "4", label: "Signal strength", value: "High bids", kind: "trend", unit: "" },
  ];
  return {
    signals,
    updatedAt: new Date().toISOString(),
  };
}

export async function getFeed(): Promise<FeedEvent[]> {
  const { mints } = await getMints();
  const feedItems = mints.slice(0, Number(process.env.FEED_ITEMS_LIMIT || 24));

  return feedItems.map((m, index) => ({
    id: m.id,
    dropLabel: `Mint #${index + 1} dropped ▸`,
    name: m.name,
    cookedFrom: `Signal: ${m.signal}`,
    description: m.mintedAt
      ? `Minted on ${new Date(m.mintedAt).toLocaleString()}. Token #${m.tokenId ?? "—"} on ${m.protocol === "rare" ? "Rare Protocol" : "SignalMint"}.`
      : `Token #${m.tokenId ?? "—"} minted from market conditions on ${m.protocol === "rare" ? "Rare Protocol" : "SignalMint"}.`,
    ctaLabel: "View NFT →",
    tokenLabel: `token #${m.tokenId ?? "—"}`,
    source: m.protocol === "rare" ? "rare.xyz" : "signalmint",
    imageUri: m.imageUri,
    ctaUrl: m.explorerUrl || "/gallery",
  }));
}
