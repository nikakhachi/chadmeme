"use client";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { useAuth } from "@/components/auth/auth-context";
import { toastTx } from "@/lib/toast-tx";

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

/** Convert (swap) SOL⇄USDC inside the user's embedded wallet, via Jupiter. */
export function useConvert() {
  const { user, walletAddress } = useAuth();
  const { signTransaction } = useSignTransaction();
  const { wallets } = useWallets();
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convert(from: "SOL" | "USDC", amount: number): Promise<boolean> {
    if (!user || !walletAddress) {
      setError("Please log in.");
      return false;
    }
    setPending(true);
    setError(null);
    const headers = { "content-type": "application/json", "x-cw-user": user.id };
    try {
      const buildRes = await fetch("/api/convert/build", {
        method: "POST",
        headers,
        body: JSON.stringify({ from, amount, userPublicKey: walletAddress }),
      });
      const built = await buildRes.json();
      if (!buildRes.ok) {
        setError(built.error ?? "Could not build the conversion.");
        return false;
      }

      const wallet = wallets.find((w) => w.address === walletAddress) ?? wallets[0];
      if (!wallet) {
        setError("No Solana wallet found.");
        return false;
      }
      const { signedTransaction } = await signTransaction({
        transaction: base64ToBytes(built.swapTransaction),
        wallet,
      });

      const sendRes = await fetch("/api/convert/send", {
        method: "POST",
        headers,
        body: JSON.stringify({ signedTransaction: bytesToBase64(signedTransaction) }),
      });
      const sent = await sendRes.json();
      if (!sendRes.ok) {
        setError(sent.error ?? "Conversion failed.");
        toast.error(sent.error ?? "Conversion failed.");
        return false;
      }

      toastTx(`Converted ${from} → ${from === "SOL" ? "USDC" : "SOL"}`, sent.signature);
      mutate((key) => Array.isArray(key) && key[0] === "/api/account");
      mutate((key) => typeof key === "string" && key.startsWith("/api/wallet/balance"));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
      return false;
    } finally {
      setPending(false);
    }
  }

  return { convert, pending, error };
}
