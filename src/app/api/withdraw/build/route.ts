import { NextResponse } from "next/server";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getUserId } from "@/lib/auth/identify";
import { MINTS } from "@/lib/solana/connection";
import { buildTransferTransaction } from "@/lib/solana/transfer";
import { sponsorGasForTx, userMissingAta } from "@/lib/solana/relayer";
import { toBaseUnits } from "@/lib/solana/jupiter";

const bodySchema = z.object({
  asset: z.enum(["SOL", "USDC"]),
  amount: z.number().positive(),
  destination: z.string().min(32),
  userPublicKey: z.string().min(32),
});

/** POST /api/withdraw/build — build an unsigned SOL/USDC transfer transaction. */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // Validate the destination is a real Solana address.
  try {
    new PublicKey(parsed.data.destination);
  } catch {
    return NextResponse.json({ error: "Invalid destination address" }, { status: 400 });
  }

  try {
    const { asset, amount, destination, userPublicKey } = parsed.data;
    const transaction = await buildTransferTransaction({
      owner: userPublicKey,
      asset,
      amount,
      destination,
    });

    // Relayer sponsors the exact gas. A plain transfer never wraps SOL; a USDC
    // withdrawal may open the recipient's USDC account (the sender pays its rent).
    try {
      await sponsorGasForTx(userPublicKey, {
        txBase64: transaction,
        spendLamports: asset === "SOL" ? Number(toBaseUnits(amount, 9)) : 0,
        wrapsSol: false,
        newAtaCount: asset === "USDC" && (await userMissingAta(destination, MINTS.USDC)) ? 1 : 0,
      });
    } catch {
      // Best-effort — see trade/swap route.
    }

    return NextResponse.json({ transaction });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not build transfer";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
