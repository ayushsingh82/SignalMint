/**
 * In-memory store for mint requests (demo). Replace with DB or agent queue in production.
 */

import type { MintRequest, RequestEventType, RequestStatus } from "./types";

const store: MintRequest[] = [];
const EVENT_LABELS: Record<RequestEventType, string> = {
  high_bids: "High bids",
  whale_bid: "Whale bid",
  many_bidders: "Many bidders",
  slow_auction: "Slow auction",
  sports_outcome: "Sports outcome",
  news_event: "News event",
  prediction_market: "Prediction market",
  custom: "Custom",
};

function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createRequest(params: {
  eventType: RequestEventType;
  description: string;
  triggerCondition?: string;
}): MintRequest {
  const request: MintRequest = {
    id: generateId(),
    eventType: params.eventType,
    description: params.description,
    triggerCondition: params.triggerCondition,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.push(request);
  return request;
}

export function getRequests(limit = 20): MintRequest[] {
  return [...store].reverse().slice(0, limit);
}

export function getEventLabel(eventType: RequestEventType): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function getStatusLabel(status: RequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
