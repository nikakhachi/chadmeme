import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/identify";
import { getNetworth } from "@/lib/trading/service";

/** GET /api/account/networth — net-worth history points for the profile chart. */
export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const points = await getNetworth(userId);
  return NextResponse.json({ points });
}
