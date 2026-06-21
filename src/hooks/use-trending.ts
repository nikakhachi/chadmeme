"use client";
import useSWR from "swr";
import type { Token } from "@/types/market";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Client hook for the trending token list, refreshed periodically. */
export function useTrending(limit = 50) {
  const { data, error, isLoading } = useSWR<{ tokens: Token[] }>(
    `/api/tokens/trending?limit=${limit}`,
    fetcher,
    { refreshInterval: 20_000, revalidateOnFocus: false },
  );
  return { tokens: data?.tokens ?? [], error, isLoading };
}

/** Live token data for a set of watchlisted addresses (skips when empty). */
export function useWatchlistTokens(addresses: string[]) {
  const key = addresses.length
    ? `/api/tokens/batch?addresses=${addresses.join(",")}`
    : null;
  const { data, isLoading } = useSWR<{ tokens: Token[] }>(key, fetcher, {
    refreshInterval: 20_000,
    revalidateOnFocus: false,
  });
  return { tokens: data?.tokens ?? [], isLoading };
}
