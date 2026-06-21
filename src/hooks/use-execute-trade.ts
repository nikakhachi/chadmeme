"use client";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { useAuth } from "@/components/auth/auth-context";
import type { TradeSide } from "@/types/market";

export interface ExecuteTradeArgs {
  side: TradeSide;
  token: {
    mint: string;
    decimals: number;
    symbol: string;
    logoURI?: string;
    marketCap?: number;
  };
  payAsset: "SOL" | "USDC";
  /** Buy: amount of payAsset to spend. Sell: amount of token to sell. */
  amount: number;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Real trade execution:
 *  1. server builds an unsigned Jupiter swap tx
 *  2. Privy embedded wallet signs it (no popup)
 *  3. server broadcasts, confirms, and records the trade
 */
export function useExecuteTrade() {
  const { user, walletAddress } = useAuth();
  const { signTransaction } = useSignTransaction();
  const { wallets } = useWallets();
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function placeTrade(args: ExecuteTradeArgs): Promise<boolean> {
    if (!user || !walletAddress) {
      setError("Please log in to trade.");
      return false;
    }
    setPending(true);
    setError(null);
    const authHeaders = { "content-type": "application/json", "x-cw-user": user.id };
    try {
      // 1. Build the unsigned swap transaction.
      const swapRes = await fetch("/api/trade/swap", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          side: args.side,
          tokenMint: args.token.mint,
          tokenDecimals: args.token.decimals,
          payAsset: args.payAsset,
          amount: args.amount,
          userPublicKey: walletAddress,
        }),
      });
      const swap = await swapRes.json();
      if (!swapRes.ok) {
        setError(swap.error ?? "Could not build the trade.");
        return false;
      }

      // 2. Sign with the embedded wallet (no confirmation UI).
      const wallet = wallets.find((w) => w.address === walletAddress) ?? wallets[0];
      if (!wallet) {
        setError("No Solana wallet found.");
        return false;
      }
      const { signedTransaction } = await signTransaction({
        transaction: base64ToBytes(swap.swapTransaction),
        wallet,
      });
      const signedBase64 = bytesToBase64(signedTransaction);

      // 3. Broadcast + record server-side.
      const tokenAmount = args.side === "buy" ? swap.outAmount : args.amount;
      const sendRes = await fetch("/api/trade/send", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          signedTransaction: signedBase64,
          side: args.side,
          token: {
            address: args.token.mint,
            symbol: args.token.symbol,
            logoURI: args.token.logoURI,
          },
          tokenAmount,
          payAsset: args.payAsset,
          marketCapUsd: args.token.marketCap ?? null,
          trader: { handle: user.handle, walletAddress },
        }),
      });
      const sent = await sendRes.json();
      if (!sendRes.ok) {
        setError(sent.error ?? "Trade failed.");
        return false;
      }

      // Refresh account + activity + feed.
      mutate(
        (key) =>
          (Array.isArray(key) && typeof key[0] === "string" && key[0].startsWith("/api/account")) ||
          (typeof key === "string" && key.startsWith("/api/feed")),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trade failed.");
      return false;
    } finally {
      setPending(false);
    }
  }

  return { placeTrade, pending, error };
}
