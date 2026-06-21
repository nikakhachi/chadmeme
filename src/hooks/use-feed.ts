"use client";
import useSWR from "swr";
import type { FeedActivity } from "@/types/trading";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Global activity feed. Assessment-scale data, so we just fetch the whole feed
 * in one request (no pagination) and refresh every few seconds for near-live
 * updates.
 */
export function useFeed() {
  const { data, isLoading } = useSWR<{ activities: FeedActivity[] }>(
    "/api/feed?limit=500",
    fetcher,
    { refreshInterval: 5_000 },
  );
  return { activities: data?.activities ?? [], isLoading };
}
