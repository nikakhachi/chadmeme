import { NextResponse } from "next/server";
import { getTokensByAddresses } from "@/lib/birdeye";

/** GET /api/tokens/batch?addresses=a,b,c — token data for the given addresses. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const addresses = (searchParams.get("addresses") ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const tokens = await getTokensByAddresses(addresses);
  return NextResponse.json({ tokens });
}
