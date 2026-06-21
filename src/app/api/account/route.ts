import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/identify";
import { getAccountView } from "@/lib/trading/service";

/** GET /api/account — cash, positions (with live PnL), and account summary. */
export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const view = await getAccountView(userId);
  return NextResponse.json(view);
}
