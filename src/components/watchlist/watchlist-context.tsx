"use client";
import { createContext, useContext, useCallback, useEffect, useState } from "react";

/**
 * Client-side watchlist of starred token addresses, persisted to localStorage.
 * Kept in React context so the sidebar list and every star button stay in sync.
 * (Local-only by design for the demo; can move to Supabase per-user later.)
 */
const STORAGE_KEY = "chadwallet.watchlist";

interface WatchlistState {
  addresses: string[];
  isStarred: (address: string) => boolean;
  toggle: (address: string) => void;
}

const WatchlistContext = createContext<WatchlistState | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<string[]>([]);

  // Hydrate from localStorage on mount (SSR-safe: starts empty, then syncs).
  // setState-in-effect is the documented exception for reading external state.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setAddresses(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    }
  }, []);

  const toggle = useCallback(
    (address: string) => {
      setAddresses((cur) => {
        const next = cur.includes(address)
          ? cur.filter((a) => a !== address)
          : [address, ...cur];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const isStarred = useCallback(
    (address: string) => addresses.includes(address),
    [addresses],
  );

  return (
    <WatchlistContext.Provider value={{ addresses, isStarred, toggle }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistState {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used within <WatchlistProvider>");
  return ctx;
}
