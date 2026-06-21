import { NextResponse } from "next/server";
import { searchTokens } from "@/lib/birdeye";

/** GET /api/tokens/search?q=bonk — search all Solana tokens by name/symbol. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const tokens = await searchTokens(q);
  return NextResponse.json({ tokens });
}
