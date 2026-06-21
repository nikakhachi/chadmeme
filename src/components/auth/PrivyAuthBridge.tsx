"use client";
import { usePrivy } from "@privy-io/react-auth";
import { AuthContext, type AuthState } from "./auth-context";

/**
 * Maps Privy's hooks onto our unified AuthState. Rendered only inside
 * <PrivyProvider> (see providers.tsx), so the Privy hooks are always available.
 *
 * The embedded Solana wallet is read from the user's linked accounts (rather
 * than the `/solana` subpath hook) to keep dependencies minimal.
 */
export function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const solanaWallet = user?.linkedAccounts?.find(
    (a) => a.type === "wallet" && "chainType" in a && a.chainType === "solana",
  ) as { address?: string } | undefined;

  // Default username from the gmail/email local part (e.g. "jane.doe") for both
  // Google and email logins; sanitized to valid username chars and ASCII-safe.
  const email = user?.google?.email ?? user?.email?.address ?? null;
  const fromEmail = email
    ? email.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "")
    : "";
  const handle = fromEmail.length >= 2 ? fromEmail : `trader${user?.id?.slice(-4) ?? ""}`;

  const value: AuthState = {
    ready,
    authenticated,
    user: user ? { id: user.id, handle } : null,
    walletAddress: solanaWallet?.address ?? null,
    isMock: false,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
