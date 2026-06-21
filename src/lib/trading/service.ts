import "server-only";
import { getPrice, getPrices } from "@/lib/birdeye";
import type {
  AccountSummary,
  FeedActivity,
  NetworthPoint,
  PositionWithPnl,
  TradeRecord,
} from "@/types/trading";
import type { TradeSide } from "@/types/market";
import { getStore, type TradeToken, type UserInfo } from "./store";
import { withPnl } from "./engine";

/**
 * Trading service — the use-case layer the API routes call. Composes the
 * persistence store with live BirdEye prices to produce display-ready account
 * state and to execute trades at the current market price.
 */

export interface AccountView {
  summary: AccountSummary;
  positions: PositionWithPnl[];
}

export async function getAccountView(userId: string): Promise<AccountView> {
  const store = getStore();
  await store.ensureUser(userId);

  const [cashUsd, positions] = await Promise.all([
    store.getCash(userId),
    store.getPositions(userId),
  ]);

  const prices = await getPrices(positions.map((p) => p.tokenAddress));
  const enriched = positions.map((p) => withPnl(p, prices[p.tokenAddress] ?? 0));

  const positionsValueUsd = enriched.reduce((sum, p) => sum + p.currentValueUsd, 0);
  const totalValueUsd = cashUsd + positionsValueUsd;

  // 24h change is approximated from the net-worth series until we snapshot more.
  const series = await store.getNetworthSeries(userId);
  const dayAgo = Date.now() / 1000 - 86_400;
  const past = [...series].reverse().find((p) => p.time <= dayAgo) ?? series[0];
  const change24hUsd = past ? totalValueUsd - past.valueUsd : 0;
  const change24hPercent = past && past.valueUsd > 0 ? (change24hUsd / past.valueUsd) * 100 : 0;

  return {
    summary: {
      cashUsd,
      positionsValueUsd,
      totalValueUsd,
      change24hUsd,
      change24hPercent,
    },
    positions: enriched.sort((a, b) => b.currentValueUsd - a.currentValueUsd),
  };
}

export interface ExecuteTradeInput {
  token: TradeToken;
  side: TradeSide;
  /** For buys: spend this much USD. */
  usdAmount?: number;
  /** For sells: an exact token quantity. Capped to holdings. */
  tokenAmount?: number;
  /** For sells: sell this fraction of holdings (0–1). */
  sellFraction?: number;
  /** Trader profile, captured for the activity feed. */
  trader?: UserInfo;
}

export async function executeTrade(
  userId: string,
  input: ExecuteTradeInput,
): Promise<TradeRecord> {
  const store = getStore();
  await store.ensureUser(userId, input.trader);

  const priceUsd = await getPrice(input.token.address);
  if (priceUsd <= 0) throw new Error("Could not fetch a live price for this token.");

  let tokenAmount: number;
  if (input.side === "sell") {
    const position = await store.getPosition(userId, input.token.address);
    const held = position?.amount ?? 0;
    const requested =
      input.sellFraction !== undefined
        ? held * input.sellFraction
        : (input.tokenAmount ?? 0);
    // Cap to holdings so "sell ~$100" / "100%" never over-sells on rounding.
    tokenAmount = Math.min(requested, held);
  } else {
    const usd = input.usdAmount ?? 0;
    tokenAmount = usd / priceUsd;
  }

  const trade = await store.recordTrade({
    userId,
    token: input.token,
    side: input.side,
    tokenAmount,
    priceUsd,
  });

  // Snapshot net worth after the trade so the chart reflects activity.
  const { summary } = await getAccountView(userId);
  await store.snapshotNetworth(userId, summary.totalValueUsd);

  return trade;
}

export async function getActivity(userId: string, limit = 50): Promise<TradeRecord[]> {
  return getStore().getTrades(userId, limit);
}

/** Global activity feed: recent trades across all users, paginated. */
export async function getFeed(limit: number, offset: number): Promise<FeedActivity[]> {
  return getStore().getRecentTrades(limit, offset);
}

export async function getNetworth(userId: string): Promise<NetworthPoint[]> {
  return getStore().getNetworthSeries(userId);
}
