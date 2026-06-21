import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/identify";
import { features } from "@/lib/env";
import { uploadObject } from "@/lib/storage/r2";
import { setAvatar } from "@/lib/trading/service";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** POST /api/account/avatar — upload a profile picture (multipart 'file'). */
export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!features.hasStorage) {
    return NextResponse.json({ error: "Image storage is not configured." }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WEBP or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Unique key per upload busts caches when the user changes their picture.
  const key = `avatars/${userId}/${Date.now()}.${EXT[file.type]}`;
  const url = await uploadObject(key, bytes, file.type);
  await setAvatar(userId, url);

  return NextResponse.json({ avatarUrl: url });
}
