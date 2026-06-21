"use client";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-context";

interface Profile {
  handle: string | null;
  walletAddress: string | null;
}

/**
 * The signed-in user's editable profile (username). Seeds the gmail-derived
 * default on first load, and exposes `save` to update it.
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
    await mutate({ handle: json.handle, walletAddress: data?.walletAddress ?? null }, false);
    return null; // success
  }

  return { username, save };
}
