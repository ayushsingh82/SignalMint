import { NextResponse } from "next/server";
import { getMints } from "@/lib/data";

/**
 * GET /api/mints
 * Returns minted NFTs for the gallery.
 * Data source: lib/data (swap for Rare Protocol subgraph/RPC later).
 */
export async function GET() {
  try {
    const data = await getMints();
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/mints error", e);
    return NextResponse.json(
      { error: "Failed to fetch mints" },
      { status: 500 }
    );
  }
}
