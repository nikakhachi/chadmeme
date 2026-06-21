import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { MINTS } from "@/lib/solana/connection";
import { sponsorGasForTx, userMissingAta } from "@/lib/solana/relayer";
import {
  buildSwapTransaction,
  fromBaseUnits,
  getQuote,
  toBaseUnits,
} from "@/lib/solana/jupiter";

const ASSET = {
  SOL: { mint: MINTS.SOL, decimals: 9 },
  USDC: { mint: MINTS.USDC, decimals: 6 },
} as const;

const bodySchema = z.object({
  from: z.enum(["SOL", "USDC"]),
  amount: z.number().positive(),
  userPublicKey: z.string().min(32),
});

/** POST /api/convert/build — build an unsigned SOL⇄USDC swap (internal wallet). */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { from, amount, userPublicKey } = parsed.data;
  const input = ASSET[from];
  const output = ASSET[from === "SOL" ? "USDC" : "SOL"];

  try {
    const quote = await getQuote({
      inputMint: input.mint,
      outputMint: output.mint,
      amount: toBaseUnits(amount, input.decimals),
    });
    const swapTransaction = await buildSwapTransaction({ quote, userPublicKey });

    // Relayer sponsors the exact gas. A SOL⇄USDC swap always wraps/unwraps SOL;
    // converting into USDC may open the user's USDC account.
    try {
      await sponsorGasForTx(userPublicKey, {
        txBase64: swapTransaction,
        spendLamports: from === "SOL" ? Number(toBaseUnits(amount, 9)) : 0,
        wrapsSol: true,
        newAtaCount: from === "SOL" && (await userMissingAta(userPublicKey, MINTS.USDC)) ? 1 : 0,
      });
    } catch {
      // Best-effort — see trade/swap route.
    }

    return NextResponse.json({
      swapTransaction,
      outAmount: fromBaseUnits(quote.outAmount, output.decimals),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion build failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
