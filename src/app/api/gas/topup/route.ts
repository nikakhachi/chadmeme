import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { fundGas } from "@/lib/solana/relayer";

const bodySchema = z.object({ wallet: z.string().min(32) });

/**
 * POST /api/gas/topup — the relayer sends the user a fixed SOL gas buffer so the
 * network fee comes out of relayer-funded SOL, not the user's balance. Called
 * before every trade/convert/withdraw so the user pays 0 fees on any action.
 * Best-effort: a failure here shouldn't block the action.
 */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const funded = await fundGas(parsed.data.wallet);
    return NextResponse.json({ funded });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gas funding failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
