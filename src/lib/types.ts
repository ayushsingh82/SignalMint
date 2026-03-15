/**
 * Types for SignalMint: mints (gallery) and market signals (mint flow input).
 */

export type MintStatus = "minted" | "auction" | "pending";

export interface Mint {
  id: string;
  name: string;
  signal: string;
  status: MintStatus;
  /** IPFS or gateway URL for the artwork */
  imageUri?: string;
  /** Token ID on-chain (when known) */
  tokenId?: string;
  /** Contract or explorer link */
  explorerUrl?: string;
  /** Block or timestamp when minted */
  mintedAt?: string;
}

export interface MarketSignal {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  /** e.g. "high_bids", "bidders_count", "auction_speed" */
  kind: string;
}

export interface SignalsResponse {
  signals: MarketSignal[];
  updatedAt: string;
}

export interface MintsResponse {
  mints: Mint[];
  total: number;
}

/** Human-submitted request for the agent to mint from a market event */
export type RequestStatus = "pending" | "processing" | "minted" | "rejected";

export type RequestEventType =
  | "high_bids"
  | "whale_bid"
  | "many_bidders"
  | "slow_auction"
  | "sports_outcome"
  | "news_event"
  | "prediction_market"
  | "custom";

export interface MintRequest {
  id: string;
  eventType: RequestEventType;
  description: string;
  triggerCondition?: string;
  status: RequestStatus;
  createdAt: string;
  mintId?: string;
}

export interface CreateRequestBody {
  eventType: RequestEventType;
  description: string;
  triggerCondition?: string;
}
