import { NextResponse } from "next/server";
import { getTokenHolders } from "@/lib/birdeye";

/** GET /api/tokens/:address/holders — top holders table. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const holders = await getTokenHolders(address, 20);
  return NextResponse.json({ holders });
}
