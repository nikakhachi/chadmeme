import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { MINTS } from "@/lib/solana/connection";
import {
  buildSwapTransaction,
  fromBaseUnits,
  getQuote,
  toBaseUnits,
} from "@/lib/solana/jupiter";

const PAY = {
  SOL: { mint: MINTS.SOL, decimals: 9 },
  USDC: { mint: MINTS.USDC, decimals: 6 },
} as const;

const bodySchema = z.object({
  side: z.enum(["buy", "sell"]),
  tokenMint: z.string().min(32),
  tokenDecimals: z.number().int().min(0).max(18),
  payAsset: z.enum(["SOL", "USDC"]),
  /** UI amount: for buy = amount of payAsset to spend; for sell = token amount. */
  amount: z.number().positive(),
  userPublicKey: z.string().min(32),
});

/**
 * POST /api/trade/swap — build an unsigned Jupiter swap transaction for a
 * buy/sell. The client signs it with the Privy embedded wallet and broadcasts.
 */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { side, tokenMint, tokenDecimals, payAsset, amount, userPublicKey } = parsed.data;
  const pay = PAY[payAsset];

  // buy: pay-asset → token. sell: token → pay-asset.
  const input = side === "buy" ? pay : { mint: tokenMint, decimals: tokenDecimals };
  const output = side === "buy" ? { mint: tokenMint, decimals: tokenDecimals } : pay;

  try {
    const quote = await getQuote({
      inputMint: input.mint,
      outputMint: output.mint,
      amount: toBaseUnits(amount, input.decimals),
    });
    const swapTransaction = await buildSwapTransaction({ quote, userPublicKey });

    return NextResponse.json({
      swapTransaction,
      inAmount: fromBaseUnits(quote.inAmount, input.decimals),
      outAmount: fromBaseUnits(quote.outAmount, output.decimals),
      priceImpactPct: Number(quote.priceImpactPct) || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Swap build failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
