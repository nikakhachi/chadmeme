"use client";
import useSWRInfinite from "swr/infinite";
import type { FeedActivity } from "@/types/trading";

const PAGE_SIZE = 10;
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FeedPage {
  activities: FeedActivity[];
  hasMore: boolean;
}

/**
 * Global activity feed with infinite scroll. Loads 10 items per page and
 * exposes `loadMore` for the scroll sentinel to call.
 */
export function useFeed() {
  const getKey = (index: number, prev: FeedPage | null) => {
    if (prev && !prev.hasMore) return null; // reached the end
    return `/api/feed?limit=${PAGE_SIZE}&offset=${index * PAGE_SIZE}`;
  };

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite<FeedPage>(
    getKey,
    fetcher,
    { revalidateFirstPage: true, refreshInterval: 15_000 },
  );

  const pages = data ?? [];
  const activities = pages.flatMap((p) => p.activities);
  const hasMore = pages.length === 0 ? true : pages[pages.length - 1].hasMore;
  const isLoadingMore = isValidating && size > pages.length;

  return {
    activities,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore: () => setSize(size + 1),
  };
}
