"use client";
import { useEffect, useState } from "react";
import { AuthContext, type AuthState, type AuthUser } from "./auth-context";

/**
 * Demo auth used when Privy isn't configured. "Logging in" creates a local
 * user persisted to localStorage so paper-trading flows are fully exercisable
 * without any keys. Swapped out automatically once NEXT_PUBLIC_PRIVY_APP_ID set.
 */
const STORAGE_KEY = "chadwallet.mock-user";
const MOCK_WALLET = "DemoWa11et1111111111111111111111111111111111";

export function MockAuthBridge({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage on mount. This is the SSR-safe
    // pattern: the first render matches the server's null state, then we sync
    // from the browser store — the documented exception to "no setState in
    // effects" (reading from an external system).
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setUser(JSON.parse(stored));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const value: AuthState = {
    ready,
    authenticated: Boolean(user),
    user,
    walletAddress: user ? MOCK_WALLET : null,
    isMock: true,
    login: () => {
      const next: AuthUser = { id: "demo-user", handle: "ChadDemo" };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUser(next);
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
