"use client";
import { ArrowDownToLine } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { CopyAddress } from "@/components/ui/copy-address";

/**
 * Crypto deposit panel. Shows the user's Solana wallet address (the embedded
 * Privy wallet in real mode) as the deposit destination for SOL / USDC.
 *
 * Real-mode follow-up: an Alchemy RPC watcher credits the paper-cash balance
 * when an on-chain transfer to this address is detected (see ARCHITECTURE.md).
 */
export function DepositCard() {
  const { walletAddress, isMock } = useAuth();

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <ArrowDownToLine className="size-4 text-brand" />
        <h2 className="text-sm font-bold">Deposit crypto</h2>
      </div>
      <p className="mb-3 text-sm text-muted">
        Send <span className="text-foreground">SOL</span> or{" "}
        <span className="text-foreground">USDC</span> on Solana to your wallet to
        fund your account.
      </p>
      <div className="rounded-lg border border-line bg-canvas p-3">
        <div className="mb-1 text-xs text-muted">Your Solana address</div>
        {walletAddress ? (
          <CopyAddress address={walletAddress} />
        ) : (
          <span className="text-sm text-muted">Log in to generate a wallet</span>
        )}
      </div>
      {isMock && (
        <p className="mt-2 text-xs text-subtle">
          Demo mode: this is a placeholder address. Connect Privy to provision a
          real embedded wallet.
        </p>
      )}
    </div>
  );
}
