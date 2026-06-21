import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/identify";
import { getActivity } from "@/lib/trading/service";

/** GET /api/account/activity — the user's trade history. */
export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const walletAddress = request.headers.get("x-cw-wallet") || null;
  const items = await getActivity(userId, walletAddress);
  return NextResponse.json({ items });
}
