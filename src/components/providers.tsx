"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { publicEnv, features } from "@/lib/env";
import { PrivyAuthBridge } from "./auth/PrivyAuthBridge";
import { MockAuthBridge } from "./auth/MockAuthBridge";
import { WatchlistProvider } from "./watchlist/watchlist-context";

/**
 * Top-level client providers. Chooses real Privy auth when an app ID is set,
 * otherwise a local mock so the app is fully usable in demo mode. Watchlist
 * state wraps everything so any component can star/unstar tokens.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <WatchlistProvider>{withAuth(children)}</WatchlistProvider>;
}

function withAuth(children: React.ReactNode) {
  if (!features.hasPrivy) {
    return <MockAuthBridge>{children}</MockAuthBridge>;
  }

  return (
    <PrivyProvider
      appId={publicEnv.privyAppId}
      config={{
        loginMethods: ["google", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#5b73ff",
          logo: undefined,
        },
        embeddedWallets: {
          // Auto-create a Solana wallet for users who sign in socially.
          solana: { createOnLogin: "users-without-wallets" },
          // Sign without a confirmation popup (trades execute silently).
          showWalletUIs: false,
        },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}
