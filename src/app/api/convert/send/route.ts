import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { broadcastAndConfirm } from "@/lib/solana/send";

const bodySchema = z.object({ signedTransaction: z.string().min(1) });

/** POST /api/convert/send — broadcast a client-signed SOL⇄USDC swap. */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const signature = await broadcastAndConfirm(parsed.data.signedTransaction);
    return NextResponse.json({ signature });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
