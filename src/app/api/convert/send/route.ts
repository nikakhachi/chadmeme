import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { broadcastAndConfirm } from "@/lib/solana/send";
import { recordConversion } from "@/lib/trading/service";

const bodySchema = z.object({
  signedTransaction: z.string().min(1),
  from: z.enum(["SOL", "USDC"]),
  fromAmount: z.number().positive(),
  toAmount: z.number().positive(),
});

/** POST /api/convert/send — broadcast a client-signed SOL⇄USDC swap + record it. */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { signedTransaction, from, fromAmount, toAmount } = parsed.data;
  const to = from === "SOL" ? "USDC" : "SOL";

  try {
    const signature = await broadcastAndConfirm(signedTransaction);
    await recordConversion(userId, { from, fromAmount, to, toAmount, txSignature: signature });
    return NextResponse.json({ signature });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
