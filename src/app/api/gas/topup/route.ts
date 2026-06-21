import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { topUpGasIfNeeded } from "@/lib/solana/relayer";

const bodySchema = z.object({ wallet: z.string().min(32) });

/**
 * POST /api/gas/topup — if the user's SOL is too low for fees, the relayer
 * sends them a little. Called before a trade/convert so USDC-only users don't
 * need to hold SOL. Best-effort: a failure here shouldn't block the action.
 */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const funded = await topUpGasIfNeeded(parsed.data.wallet);
    return NextResponse.json({ funded });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gas top-up failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
