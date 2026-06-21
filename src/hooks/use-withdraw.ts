"use client";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { useAuth } from "@/components/auth/auth-context";

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
 * Withdraw SOL/USDC to an external address: server builds the transfer, the
 * embedded wallet signs it (no popup), the server broadcasts + confirms.
 */
export function useWithdraw() {
  const { user, walletAddress } = useAuth();
  const { signTransaction } = useSignTransaction();
  const { wallets } = useWallets();
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw(args: {
    asset: "SOL" | "USDC";
    amount: number;
    destination: string;
  }): Promise<string | null> {
    if (!user || !walletAddress) {
      setError("Please log in.");
      return null;
    }
    setPending(true);
    setError(null);
    const headers = { "content-type": "application/json", "x-cw-user": user.id };
    try {
      const buildRes = await fetch("/api/withdraw/build", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...args, userPublicKey: walletAddress }),
      });
      const built = await buildRes.json();
      if (!buildRes.ok) {
        setError(built.error ?? "Could not build the withdrawal.");
        return null;
      }

      const wallet = wallets.find((w) => w.address === walletAddress) ?? wallets[0];
      if (!wallet) {
        setError("No Solana wallet found.");
        return null;
      }
      const { signedTransaction } = await signTransaction({
        transaction: base64ToBytes(built.transaction),
        wallet,
      });

      const sendRes = await fetch("/api/withdraw/send", {
        method: "POST",
        headers,
        body: JSON.stringify({ signedTransaction: bytesToBase64(signedTransaction) }),
      });
      const sent = await sendRes.json();
      if (!sendRes.ok) {
        setError(sent.error ?? "Withdrawal failed.");
        return null;
      }

      mutate((key) => Array.isArray(key) && key[0] === "/api/account");
      return sent.signature as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed.");
      return null;
    } finally {
      setPending(false);
    }
  }

  return { withdraw, pending, error };
}
