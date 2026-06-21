import { NextResponse } from "next/server";
import { getFeed } from "@/lib/trading/service";

/**
 * GET /api/feed?limit=500 — global activity feed (all traders), newest first.
 * The client fetches the whole feed in one request (assessment-scale data).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 500, 1000);

  const activities = await getFeed(limit, 0);
  return NextResponse.json({ activities });
}
