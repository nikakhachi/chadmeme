"use client";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-context";
import type { AccountSummary, PositionWithPnl } from "@/types/trading";

interface AccountResponse {
  summary: AccountSummary;
  positions: PositionWithPnl[];
}

/**
 * The signed-in user's account: cash, positions (with live PnL), and summary.
 * Refreshes periodically so PnL tracks live prices. `enabled` gates fetching
 * to authenticated users.
 */
export function useAccount(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, error, isLoading, mutate } = useSWR<AccountResponse>(
    enabled && userId ? ["/api/account", userId] : null,
    ([url]: [string]) =>
      fetch(url, { headers: { "x-cw-user": userId! } }).then((r) => r.json()),
    { refreshInterval: 15_000, revalidateOnFocus: true },
  );

  return {
    account: data?.summary,
    positions: data?.positions ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
