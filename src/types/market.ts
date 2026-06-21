/**
 * Market data domain — the normalized shapes the UI consumes.
 *
 * These are intentionally decoupled from any single provider's response shape.
 * The BirdEye client (src/lib/birdeye) maps raw API responses into these types,
 * so swapping providers later only touches the mapping layer.
 */

/** A tradable Solana token as shown in lists and headers. */
export interface Token {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
  priceUsd: number;
  /** 24h price change, percent (e.g. 442.81). */
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  holders: number;
}

/** Extended info shown on a token's detail page. */
export interface TokenDetail extends Token {
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  /** Circulating supply, used to convert price <-> market cap. */
  supply?: number;
  /** Percent of supply held by the top 10 holders. */
  top10HoldersPercent?: number;
}

/** OHLCV candle for the price chart. `time` is unix seconds (chart lib format). */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Supported chart resolutions, mapped to provider params in the client. */
export type ChartInterval = "1m" | "5m" | "15m" | "1H" | "4H" | "1D";

export type TradeSide = "buy" | "sell";

/** A single on-chain swap in the live trades feed. */
export interface MarketTrade {
  txHash: string;
  side: TradeSide;
  traderAddress: string;
  /** USD value of the trade. */
  valueUsd: number;
  tokenAmount: number;
  priceUsd: number;
  /** Unix milliseconds. */
  timestamp: number;
}

/** A holder row in the holders table. */
export interface Holder {
  ownerAddress: string;
  tokenAmount: number;
  valueUsd: number;
  /** Percent of total supply held. */
  percentage: number;
}
