import { NextResponse } from "next/server";
import { getFeed } from "@/lib/trading/service";

/**
 * GET /api/feed?limit=10&offset=0 — global activity feed (all traders).
 * Returns `activities` plus `hasMore` to drive infinite scroll.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const activities = await getFeed(limit, offset);
  return NextResponse.json({ activities, hasMore: activities.length === limit });
}
