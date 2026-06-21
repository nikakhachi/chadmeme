import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { broadcastAndConfirm } from "@/lib/solana/send";
import { recordWithdrawal } from "@/lib/trading/service";

const bodySchema = z.object({
  signedTransaction: z.string().min(1),
  asset: z.enum(["SOL", "USDC"]),
  amount: z.number().positive(),
});

/** POST /api/withdraw/send — broadcast a client-signed transfer and confirm. */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const signature = await broadcastAndConfirm(parsed.data.signedTransaction);
    await recordWithdrawal(userId, {
      asset: parsed.data.asset,
      amount: parsed.data.amount,
      txSignature: signature,
    });
    return NextResponse.json({ signature });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Withdrawal failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
