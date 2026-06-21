import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/identify";
import { features } from "@/lib/env";
import { getOrInitProfile, setUsername } from "@/lib/trading/service";

/**
 * GET  /api/account/profile — the user's username + wallet (seeds the gmail
 *      default on first access via x-cw-handle / x-cw-wallet headers).
 * POST /api/account/profile — update the username.
 */
export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getOrInitProfile(userId, {
    handle: request.headers.get("x-cw-handle") || undefined,
    walletAddress: request.headers.get("x-cw-wallet") || undefined,
  });
  return NextResponse.json({ ...profile, storageEnabled: features.hasStorage });
}

const bodySchema = z.object({
  // Usernames: 2–20 chars, letters/numbers/underscore/dot/hyphen.
  handle: z
    .string()
    .trim()
    .min(2, "Too short")
    .max(20, "Too long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use letters, numbers, _ . -"),
});

export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid username" },
      { status: 400 },
    );
  }

  await setUsername(userId, parsed.data.handle);
  return NextResponse.json({ handle: parsed.data.handle });
}
