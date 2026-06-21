"use client";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { cn } from "@/lib/utils";

/**
 * Profile picture with click-to-upload. Downscales the chosen image to 512px
 * client-side (keeps uploads tiny + square) before sending to R2.
 */
export function AvatarUploader() {
  const { username, avatarUrl, storageEnabled, uploadAvatar } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const resized = await downscaleSquare(file, 512);
      const err = await uploadAvatar(resized);
      if (err) setError(err);
    } catch {
      setError("Could not process image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={() => storageEnabled && inputRef.current?.click()}
        disabled={!storageEnabled || busy}
        className="group relative size-14 overflow-hidden rounded-full"
        title={storageEnabled ? "Change picture" : "Image uploads not configured"}
      >
        <TokenAvatar symbol={username} logoURI={avatarUrl ?? undefined} size="lg" className="size-14" />
        {storageEnabled && (
          <span
            className={cn(
              "absolute inset-0 grid place-items-center bg-black/50 text-white transition-opacity",
              busy ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <Camera className="size-5" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onPick}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-down">{error}</p>}
    </div>
  );
}

/** Center-crop + resize an image file to a square `size`×`size` PNG. */
async function downscaleSquare(file: File, size: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png", 0.9),
  );
  return new File([blob], "avatar.png", { type: "image/png" });
}
