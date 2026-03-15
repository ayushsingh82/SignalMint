/**
 * Data layer for SignalMint.
 * Replace mock implementations with Rare Protocol / chain RPC or subgraph when ready.
 */

import type { Mint, MarketSignal, MintsResponse, SignalsResponse } from "./types";

// Images: trading, prediction markets, sports, news (Unsplash, free to use)
// Trading/charts: 1579621970563-ebec7560ff52, 1590283603385-17ffb3a7f29f | Sports: 1461896836934-5f5655182d4e, 1574629810360-7efbbe195018 | News: 1495020689067-958852a7765e, 1504711434969-e33886168f5c
const MOCK_MINTS: Mint[] = [
  {
    id: "1",
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
 * Fetch mints for the gallery.
 * TODO: Replace with Rare Protocol subgraph or contract reads (e.g. tokenURI, tokenByIndex).
 */
export async function getMints(): Promise<MintsResponse> {
  // Simulate async (e.g. RPC/subgraph)
  await Promise.resolve();
  return {
    mints: [...MOCK_MINTS],
    total: MOCK_MINTS.length,
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
