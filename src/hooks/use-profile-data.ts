"use client";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-context";
import type { NetworthPoint, TradeRecord } from "@/types/trading";

/** Trade history for the signed-in user. */
export function useActivity() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data, isLoading } = useSWR<{ trades: TradeRecord[] }>(
    userId ? ["/api/account/activity", userId] : null,
    ([url]: [string]) =>
      fetch(url, { headers: { "x-cw-user": userId! } }).then((r) => r.json()),
    { refreshInterval: 15_000 },
  );
  return { trades: data?.trades ?? [], isLoading };
}

/** Net-worth history points for the profile chart. */
export function useNetworth() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data, isLoading } = useSWR<{ points: NetworthPoint[] }>(
    userId ? ["/api/account/networth", userId] : null,
    ([url]: [string]) =>
      fetch(url, { headers: { "x-cw-user": userId! } }).then((r) => r.json()),
    { refreshInterval: 30_000 },
  );
  return { points: data?.points ?? [], isLoading };
}
