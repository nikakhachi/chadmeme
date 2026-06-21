"use client";
import useSWR from "swr";
import type { Candle, ChartInterval, Holder, MarketTrade } from "@/types/market";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Live OHLCV candles for a token at the chosen interval. */
export function useOHLCV(address: string, interval: ChartInterval) {
  const { data, isLoading } = useSWR<{ candles: Candle[] }>(
    `/api/tokens/${address}/ohlcv?interval=${interval}`,
    fetcher,
    { refreshInterval: 15_000, revalidateOnFocus: false },
  );
  return { candles: data?.candles ?? [], isLoading };
}

/** Live trade feed for a token, polled frequently. */
export function useTokenTrades(address: string) {
  const { data, isLoading } = useSWR<{ trades: MarketTrade[] }>(
    `/api/tokens/${address}/trades`,
    fetcher,
    { refreshInterval: 8_000, revalidateOnFocus: true },
  );
  return { trades: data?.trades ?? [], isLoading };
}

/** Top holders for a token. */
export function useHolders(address: string) {
  const { data, isLoading } = useSWR<{ holders: Holder[] }>(
    `/api/tokens/${address}/holders`,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );
  return { holders: data?.holders ?? [], isLoading };
}
