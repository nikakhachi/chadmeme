import { NextResponse } from "next/server";
import { getTrendingTokens } from "@/lib/birdeye";

/** GET /api/tokens/trending?limit=50 — trending tokens (real or mock). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 50;
  const tokens = await getTrendingTokens(limit);
  return NextResponse.json({ tokens });
}
