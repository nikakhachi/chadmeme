import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { recordRealTrade } from "@/lib/trading/service";

const bodySchema = z.object({
  signedTransaction: z.string().min(1), // base64
  side: z.enum(["buy", "sell"]),
  token: z.object({
    address: z.string().min(1),
    symbol: z.string().min(1),
    logoURI: z.string().optional(),
  }),
  tokenAmount: z.number().positive(),
  payAsset: z.enum(["SOL", "USDC"]),
  marketCapUsd: z.number().nullable().optional(),
  trader: z
    .object({ handle: z.string().optional(), walletAddress: z.string().optional() })
    .optional(),
});

/**
 * POST /api/trade/send — broadcast a client-signed swap, confirm on-chain, and
 * record it in the trade ledger. Returns the transaction signature.
 */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { signature, trade } = await recordRealTrade(userId, parsed.data);
    return NextResponse.json({ signature, trade });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Trade failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
