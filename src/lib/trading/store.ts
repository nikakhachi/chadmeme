import "server-only";
import { features } from "@/lib/env";
import type { NetworthPoint, Position, TradeRecord } from "@/types/trading";
import type { TradeSide } from "@/types/market";
import { memoryStore } from "./memory-store";
import { supabaseStore } from "./supabase-store";

/** Minimal token info needed to record a position/trade. */
export interface TradeToken {
  address: string;
  symbol: string;
  logoURI?: string;
}

/**
 * Persistence boundary for paper trading. Two implementations satisfy this:
 *   - memoryStore   (default; in-process, great for demo + dev)
 *   - supabaseStore  (when Supabase is configured; durable)
 * The API layer only depends on this interface.
 */
export interface TradingStore {
  /** Ensure a user row exists; returns the canonical user id + cash balance. */
  ensureUser(userId: string, walletAddress?: string | null): Promise<void>;
  getCash(userId: string): Promise<number>;
  getPositions(userId: string): Promise<Position[]>;
  getPosition(userId: string, tokenAddress: string): Promise<Position | null>;
  getTrades(userId: string, limit?: number): Promise<TradeRecord[]>;
  getNetworthSeries(userId: string): Promise<NetworthPoint[]>;
  /** Persist a fill: update cash + position and append a trade row. */
  recordTrade(args: {
    userId: string;
    token: TradeToken;
    side: TradeSide;
    tokenAmount: number;
    priceUsd: number;
  }): Promise<TradeRecord>;
  /** Append a net-worth snapshot point. */
  snapshotNetworth(userId: string, valueUsd: number): Promise<void>;
}

/** Resolve the active store: durable Supabase when configured, else in-memory. */
export function getStore(): TradingStore {
  return features.hasSupabase ? supabaseStore : memoryStore;
}
