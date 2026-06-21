import { NextResponse } from "next/server";
import { getOHLCV } from "@/lib/birdeye";
import type { ChartInterval } from "@/types/market";

const INTERVALS: ChartInterval[] = ["1m", "5m", "15m", "1H", "4H", "1D"];

/** GET /api/tokens/:address/ohlcv?interval=15m — candles for the price chart. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const { searchParams } = new URL(request.url);
  const intervalParam = searchParams.get("interval") as ChartInterval | null;
  const interval = intervalParam && INTERVALS.includes(intervalParam) ? intervalParam : "15m";

  const candles = await getOHLCV(address, interval);
  return NextResponse.json({ candles });
}
