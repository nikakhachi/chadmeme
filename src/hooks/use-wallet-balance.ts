"use client";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-context";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Live SOL/USDC wallet balances via RPC only (no BirdEye), polled every few
 * seconds so deposits/withdrawals reflect quickly. Use this for balance display
 * where freshness matters; the fuller priced account view refreshes slower.
 */
export function useWalletBalance() {
  const { walletAddress } = useAuth();
  const { data } = useSWR<{ solBalance: number; usdcBalance: number }>(
    walletAddress ? `/api/wallet/balance?address=${walletAddress}` : null,
    fetcher,
    { refreshInterval: 7_000, revalidateOnFocus: true },
  );
  return { solBalance: data?.solBalance ?? 0, usdcBalance: data?.usdcBalance ?? 0 };
}
