import { NextResponse } from "next/server";
import { getSignals } from "@/lib/data";

/**
 * GET /api/signals
 * Returns current market signals that drive the agent's art.
 * Data source: lib/data (swap for chain/subgraph later).
 */
export async function GET() {
  try {
    const data = await getSignals();
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/signals error", e);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
