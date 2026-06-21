import { NextResponse } from "next/server";
import { getSolBalance, getUsdcBalance } from "@/lib/solana/balances";

/**
 * GET /api/wallet/balance?address=... — SOL + USDC balances via RPC only
 * (no BirdEye), so it's safe to poll frequently (e.g. to reflect a deposit).
 */
export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address) return NextResponse.json({ solBalance: 0, usdcBalance: 0 });

  const [solBalance, usdcBalance] = await Promise.all([
    getSolBalance(address),
    getUsdcBalance(address),
  ]);
  return NextResponse.json({ solBalance, usdcBalance });
}
