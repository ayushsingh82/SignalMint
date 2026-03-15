import { NextResponse } from "next/server";
import {
  createRequest,
  getRequests,
} from "@/lib/requests";
import type { CreateRequestBody, RequestEventType } from "@/lib/types";

const VALID_EVENT_TYPES: RequestEventType[] = [
  "high_bids",
  "whale_bid",
  "many_bidders",
  "slow_auction",
  "sports_outcome",
  "news_event",
  "prediction_market",
  "custom",
];

/**
 * GET /api/requests
 * Returns recent mint requests (human-submitted).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const requests = getRequests(limit);
    return NextResponse.json({ requests, total: requests.length });
  } catch (e) {
    console.error("GET /api/requests error", e);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requests
 * Create a new mint request. Agent will pick it up and mint when the market event matches.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateRequestBody>;
    const { eventType, description, triggerCondition } = body;

    if (!eventType || !description?.trim()) {
      return NextResponse.json(
        { error: "eventType and description are required" },
        { status: 400 }
      );
    }

    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid eventType" },
        { status: 400 }
      );
    }

    const request = createRequest({
      eventType,
      description: description.trim(),
      triggerCondition: triggerCondition?.trim(),
    });

    return NextResponse.json({
      success: true,
      request: {
        id: request.id,
        eventType: request.eventType,
        description: request.description,
        triggerCondition: request.triggerCondition,
        status: request.status,
        createdAt: request.createdAt,
      },
    });
  } catch (e) {
    console.error("POST /api/requests error", e);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
