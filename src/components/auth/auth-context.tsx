"use client";
import { createContext, useContext } from "react";

/**
 * Unified auth surface for the app. Both the real Privy bridge and the mock
 * bridge implement this, so components call `useAuth()` without caring which
 * mode is active. See providers.tsx for how the bridge is chosen.
 */
export interface AuthUser {
  id: string;
  handle: string;
}

export interface AuthState {
  /** True once the auth provider has finished initializing. */
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  /** The user's Solana wallet address (deposit destination), if any. */
  walletAddress: string | null;
  /** Whether real auth (Privy) is configured; false ⇒ mock/demo mode. */
  isMock: boolean;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <Providers>");
  }
  return ctx;
}
