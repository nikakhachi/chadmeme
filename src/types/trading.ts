/**
 * Trading domain — our paper-trading model, persisted in Postgres.
 *
 * Paper trades execute against real live prices but move virtual USD cash, so
 * no funds are at risk. The execution boundary lives in src/lib/trading; swap
 * it for real Jupiter swaps later without changing these shapes.
 */
import type { TradeSide } from "./market";

/** A user's open position in a single token. */
export interface Position {
  id: string;
  userId: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenLogoURI?: string;
  /** Quantity of the token currently held. */
  amount: number;
  /** USD cost basis per token (weighted average entry). */
  avgEntryPriceUsd: number;
  /** Total USD invested at entry (sum of buys minus sells, at cost). */
  costBasisUsd: number;
  createdAt: string;
  updatedAt: string;
}

/** A position enriched with live price for display (computed, not stored). */
export interface PositionWithPnl extends Position {
  currentPriceUsd: number;
  currentValueUsd: number;
  /** Unrealized profit/loss in USD. */
  pnlUsd: number;
  /** Unrealized profit/loss as a percentage of cost basis. */
  pnlPercent: number;
}

/** An executed buy or sell, immutable once written (activity history). */
export interface TradeRecord {
  id: string;
  userId: string;
  tokenAddress: string;
  tokenSymbol: string;
  side: TradeSide;
  tokenAmount: number;
  priceUsd: number;
  /** USD value moved (tokenAmount * priceUsd). */
  valueUsd: number;
  /** Token market cap at trade time, if captured. */
  marketCapUsd?: number | null;
  createdAt: string;
}

/** A trade by any user, shown in the global activity feed. */
export interface FeedActivity {
  id: string;
  traderId: string;
  traderHandle: string | null;
  traderWallet: string | null;
  tokenAddress: string;
  tokenSymbol: string;
  side: TradeSide;
  tokenAmount: number;
  valueUsd: number;
  /** Token market cap at the time of the trade (if captured). */
  marketCapUsd: number | null;
  createdAt: string;
}

/** A single point in a user's net-worth history chart. */
export interface NetworthPoint {
  /** Unix seconds. */
  time: number;
  /** Total account value (cash + positions) in USD. */
  valueUsd: number;
}

/** Aggregated account state shown on the profile. */
export interface AccountSummary {
  cashUsd: number;
  positionsValueUsd: number;
  totalValueUsd: number;
  /** 24h change in total value, USD and percent. */
  change24hUsd: number;
  change24hPercent: number;
}
