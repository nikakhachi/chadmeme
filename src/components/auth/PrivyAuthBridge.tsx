"use client";
import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useCreateWallet } from "@privy-io/react-auth/solana";
import { AuthContext, type AuthState } from "./auth-context";

/**
 * Maps Privy's hooks onto our unified AuthState. Rendered only inside
 * <PrivyProvider>, so the Privy hooks are always available.
 *
 * The embedded Solana wallet address is read from `useWallets()` (the canonical
 * source) and, as a safety net, created if a logged-in user somehow has none —
 * so every authenticated user always has a wallet address.
 */
export function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const creating = useRef(false);

  const walletAddress = wallets[0]?.address ?? null;

  // Ensure a logged-in user always has an embedded Solana wallet.
  useEffect(() => {
    if (ready && authenticated && walletsReady && wallets.length === 0 && !creating.current) {
      creating.current = true;
      createWallet()
        .catch(() => {})
        .finally(() => {
          creating.current = false;
        });
    }
  }, [ready, authenticated, walletsReady, wallets.length, createWallet]);

  // Default username from the gmail/email local part (e.g. "jane.doe"),
  // sanitized to valid username chars and ASCII-safe.
  const email = user?.google?.email ?? user?.email?.address ?? null;
  const fromEmail = email ? email.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "") : "";
  const handle = fromEmail.length >= 2 ? fromEmail : `trader${user?.id?.slice(-4) ?? ""}`;

  const value: AuthState = {
    ready,
    authenticated,
    user: user ? { id: user.id, handle } : null,
    walletAddress,
    isMock: false,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
