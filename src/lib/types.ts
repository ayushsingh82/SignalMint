/**
 * Types for SignalMint: mints (gallery) and market signals (mint flow input).
 */

export type MintStatus = "minted" | "auction" | "pending";

export interface Mint {
  id: string;
  name: string;
  signal: string;
  status: MintStatus;
  /** ERC-8004 identity id for the minting agent (when known) */
  identityId?: string;
  /** IPFS or gateway URL for the artwork */
  imageUri?: string;
  /** Token ID on-chain (when known) */
  tokenId?: string;
  /** NFT view on block explorer */
  explorerUrl?: string;
  /** Mint transaction on block explorer */
  txExplorerUrl?: string;
  /** ipfs:// metadata URI or HTTPS gateway to JSON */
  metadataUri?: string;
  /** Mint transaction hash */
  txHash?: string;
  /** Source of the mint record */
  protocol?: "rare" | "mock";
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

/** Feed event: one news/drop item for the Feed page */
export interface FeedEvent {
  id: string;
  /** e.g. "gent #10434 dropped ▸" */
  dropLabel: string;
  /** Artwork / drop name */
  name: string;
  /** Cooked from source title */
  cookedFrom: string;
  /** Short description */
  description: string;
  /** CTA e.g. "Ape In →" */
  ctaLabel: string;
  /** e.g. "token #2010" */
  tokenLabel: string;
  /** Source domain or URL label */
  source: string;
  /** Small image for the event */
  imageUri?: string;
  /** Optional link for CTA */
  ctaUrl?: string;
}
