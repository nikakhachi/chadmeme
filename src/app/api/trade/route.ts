import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { executeTrade } from "@/lib/trading/service";
import { TradeError } from "@/lib/trading/engine";

const bodySchema = z.object({
  token: z.object({
    address: z.string().min(1),
    symbol: z.string().min(1),
    logoURI: z.string().optional(),
    marketCap: z.number().optional(),
  }),
  side: z.enum(["buy", "sell"]),
  usdAmount: z.number().positive().optional(),
  tokenAmount: z.number().positive().optional(),
  sellFraction: z.number().min(0).max(1).optional(),
  trader: z
    .object({
      handle: z.string().optional(),
      walletAddress: z.string().optional(),
    })
    .optional(),
});

/** POST /api/trade — execute a paper buy/sell at the live market price. */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const trade = await executeTrade(userId, parsed.data);
    return NextResponse.json({ trade });
  } catch (err) {
    const message =
      err instanceof TradeError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Trade failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
