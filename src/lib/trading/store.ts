import "server-only";
import { features } from "@/lib/env";
import type {
  FeedActivity,
  NetworthPoint,
  Position,
  TradeRecord,
  TransferRecord,
} from "@/types/trading";
import type { TradeSide } from "@/types/market";
import { memoryStore } from "./memory-store";
import { supabaseStore } from "./supabase-store";

/** Minimal token info needed to record a position/trade. */
export interface TradeToken {
  address: string;
  symbol: string;
  logoURI?: string;
  /** Market cap at trade time, captured for the activity feed. */
  marketCap?: number;
}

/** Optional profile info captured when a user first acts (for the feed). */
export interface UserInfo {
  walletAddress?: string | null;
  handle?: string | null;
}

/**
 * Persistence boundary for paper trading. Two implementations satisfy this:
 *   - memoryStore   (default; in-process, great for demo + dev)
 *   - supabaseStore  (when Supabase is configured; durable)
 * The API layer only depends on this interface.
 */
export interface TradingStore {
  /** Ensure a user row exists. Seeds handle/wallet on creation only — never
   *  overwrites an existing (possibly user-edited) value. */
  ensureUser(userId: string, info?: UserInfo): Promise<void>;
  /** Read a user's profile (username + wallet + avatar). */
  getProfile(userId: string): Promise<{
    handle: string | null;
    walletAddress: string | null;
    avatarUrl: string | null;
  }>;
  /** Explicitly set a user's username (profile edit). */
  updateUsername(userId: string, handle: string): Promise<void>;
  /** Set a user's avatar URL (after an upload). */
  updateAvatar(userId: string, avatarUrl: string): Promise<void>;
  getCash(userId: string): Promise<number>;
  getPositions(userId: string): Promise<Position[]>;
  getPosition(userId: string, tokenAddress: string): Promise<Position | null>;
  getTrades(userId: string, limit?: number): Promise<TradeRecord[]>;
  getNetworthSeries(userId: string): Promise<NetworthPoint[]>;
  /** Recent trades across ALL users (global activity feed), newest first. */
  getRecentTrades(limit: number, offset: number): Promise<FeedActivity[]>;
  /** Persist a fill: update cash + position and append a trade row. */
  recordTrade(args: {
    userId: string;
    token: TradeToken;
    side: TradeSide;
    tokenAmount: number;
    priceUsd: number;
  }): Promise<TradeRecord>;
  /** Append a row for a REAL executed on-chain swap (no cash/position math). */
  logTrade(args: {
    userId: string;
    token: TradeToken;
    side: TradeSide;
    tokenAmount: number;
    priceUsd: number;
    valueUsd: number;
    marketCapUsd?: number | null;
    payAsset: "SOL" | "USDC";
    txSignature: string;
  }): Promise<TradeRecord>;
  /** Record an app-initiated transfer (withdrawal/conversion) for activity. */
  logTransfer(args: {
    userId: string;
    kind: "deposit" | "withdraw" | "convert";
    asset: "SOL" | "USDC";
    amount: number;
    toAsset?: "SOL" | "USDC";
    toAmount?: number;
    txSignature: string;
  }): Promise<void>;
  /** Read a user's recorded transfers (withdrawals), newest first. */
  getTransfers(userId: string, limit?: number): Promise<TransferRecord[]>;
  /** Append a net-worth snapshot point. */
  snapshotNetworth(userId: string, valueUsd: number): Promise<void>;
}

/** Resolve the active store: durable Supabase when configured, else in-memory. */
export function getStore(): TradingStore {
  return features.hasSupabase ? supabaseStore : memoryStore;
}
