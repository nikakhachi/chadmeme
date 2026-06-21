import { NextResponse } from "next/server";
import { getTokenTrades } from "@/lib/birdeye";

/** GET /api/tokens/:address/trades — recent on-chain swaps (live feed). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const trades = await getTokenTrades(address, 40);
  return NextResponse.json({ trades });
}
