"use client";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-context";

interface Profile {
  handle: string | null;
  walletAddress: string | null;
  avatarUrl: string | null;
  storageEnabled: boolean;
}

/**
 * The signed-in user's editable profile (username + avatar). Seeds the gmail
 * default username on first load, and exposes `save` / `uploadAvatar`.
 */
export function useProfile() {
  const { user, walletAddress } = useAuth();
  const userId = user?.id;

  const { data, mutate } = useSWR<Profile>(
    userId ? ["/api/account/profile", userId] : null,
    ([url]: [string]) =>
      fetch(url, {
        headers: {
          "x-cw-user": userId!,
          "x-cw-handle": user?.handle ?? "",
          "x-cw-wallet": walletAddress ?? "",
        },
      }).then((r) => r.json()),
  );

  const username = data?.handle ?? user?.handle ?? "trader";

  async function save(handle: string): Promise<string | null> {
    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: { "content-type": "application/json", "x-cw-user": userId! },
      body: JSON.stringify({ handle }),
    });
    const json = await res.json();
    if (!res.ok) return json.error ?? "Could not save";
    await mutate((cur) => (cur ? { ...cur, handle: json.handle } : cur), false);
    return null;
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/account/avatar", {
      method: "POST",
      headers: { "x-cw-user": userId! },
      body,
    });
    const json = await res.json();
    if (!res.ok) return json.error ?? "Upload failed";
    await mutate((cur) => (cur ? { ...cur, avatarUrl: json.avatarUrl } : cur), false);
    return null;
  }

  return {
    username,
    avatarUrl: data?.avatarUrl ?? null,
    storageEnabled: data?.storageEnabled ?? false,
    save,
    uploadAvatar,
  };
}
