"use client";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-context";
import type { ActivityItem, NetworthPoint } from "@/types/trading";

/** Unified activity (swaps + deposits + withdrawals) for the signed-in user. */
export function useActivity() {
  const { user, walletAddress } = useAuth();
  const userId = user?.id;
  const { data, isLoading } = useSWR<{ items: ActivityItem[] }>(
    userId ? ["/api/account/activity", userId, walletAddress] : null,
    ([url]: [string]) =>
      fetch(url, {
        headers: { "x-cw-user": userId!, "x-cw-wallet": walletAddress ?? "" },
      }).then((r) => r.json()),
    { refreshInterval: 20_000 },
  );
  return { items: data?.items ?? [], isLoading };
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
