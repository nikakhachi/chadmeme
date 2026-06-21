"use client";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { useAuth } from "@/components/auth/auth-context";
import type { TradeSide } from "@/types/market";

export interface PlaceTradeArgs {
  token: { address: string; symbol: string; logoURI?: string; marketCap?: number };
  side: TradeSide;
  /** Buys: USD to spend. */
  usdAmount?: number;
  /** Sells: exact number of tokens to sell (capped to holdings server-side). */
  tokenAmount?: number;
  /** Sells: fraction of holdings to sell (0–1). Used by the % buttons. */
  sellFraction?: number;
}

/**
 * Imperative trade action + pending/error state. On success it revalidates the
 * account and activity caches so balances/positions update immediately.
 */
export function useTrade() {
  const { user, walletAddress } = useAuth();
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function placeTrade(args: PlaceTradeArgs): Promise<boolean> {
    if (!user) {
      setError("Please log in to trade.");
      return false;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "content-type": "application/json", "x-cw-user": user.id },
        // Include trader profile so the global feed can show who traded.
        body: JSON.stringify({
          ...args,
          trader: { handle: user.handle, walletAddress: walletAddress ?? undefined },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Trade failed");
        return false;
      }
      // Refresh any account/activity queries (keys are arrays starting with the url).
      mutate((key) => Array.isArray(key) && typeof key[0] === "string" && key[0].startsWith("/api/account"));
      return true;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setPending(false);
    }
  }

  return { placeTrade, pending, error };
}
