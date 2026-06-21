import "server-only";
import { getPrice, getTokensByAddresses } from "@/lib/birdeye";
import { getSolBalance, getTokenBalances } from "@/lib/solana/balances";
import { MINTS } from "@/lib/solana/connection";
import { broadcastAndConfirm } from "@/lib/solana/send";
import type {
  AccountSummary,
  FeedActivity,
  NetworthPoint,
  PositionWithPnl,
  TradeRecord,
} from "@/types/trading";
import type { TradeSide } from "@/types/market";
import { getStore, type TradeToken, type UserInfo } from "./store";

/**
 * Trading service — the use-case layer the API routes call. Account state is
 * derived from REAL on-chain balances (SOL/USDC/SPL tokens) priced with
 * BirdEye; cost basis (for PnL) is reconstructed from our trade ledger.
 */

export interface AccountView {
  summary: AccountSummary;
  positions: PositionWithPnl[];
}

const EMPTY_SUMMARY: AccountSummary = {
  cashUsd: 0,
  positionsValueUsd: 0,
  totalValueUsd: 0,
  change24hUsd: 0,
  change24hPercent: 0,
  solBalance: 0,
  usdcBalance: 0,
  solPriceUsd: 0,
};

export async function getAccountView(
  userId: string,
  walletAddress: string | null,
): Promise<AccountView> {
  const store = getStore();
  await store.ensureUser(userId);
  if (!walletAddress) return { summary: EMPTY_SUMMARY, positions: [] };

  const [solBalance, tokenBalances, trades] = await Promise.all([
    getSolBalance(walletAddress),
    getTokenBalances(walletAddress),
    store.getTrades(userId, 500),
  ]);

  const usdcBalance = tokenBalances.find((b) => b.mint === MINTS.USDC)?.amount ?? 0;
  const holdings = tokenBalances.filter(
    (b) => b.mint !== MINTS.USDC && b.mint !== MINTS.SOL && b.amount > 0,
  );

  // Live SOL price + metadata/prices for every held token (one BirdEye call each).
  const [solPrice, tokens] = await Promise.all([
    getPrice(MINTS.SOL),
    getTokensByAddresses(holdings.map((b) => b.mint)),
  ]);
  const tokenMap = new Map(tokens.map((t) => [t.address, t]));
  const avgEntries = computeAvgEntries(trades);

  const positions: PositionWithPnl[] = holdings
    .map((b): PositionWithPnl => {
      const meta = tokenMap.get(b.mint);
      const price = meta?.priceUsd ?? 0;
      const avgEntry = avgEntries.get(b.mint) ?? 0;
      const currentValueUsd = b.amount * price;
      return {
        id: b.mint,
        userId,
        tokenAddress: b.mint,
        tokenSymbol: meta?.symbol ?? "—",
        tokenLogoURI: meta?.logoURI,
        amount: b.amount,
        avgEntryPriceUsd: avgEntry,
        costBasisUsd: avgEntry * b.amount,
        createdAt: "",
        updatedAt: "",
        currentPriceUsd: price,
        currentValueUsd,
        pnlUsd: avgEntry > 0 ? (price - avgEntry) * b.amount : 0,
        pnlPercent: avgEntry > 0 ? ((price - avgEntry) / avgEntry) * 100 : 0,
      };
    })
    .filter((p) => p.currentValueUsd >= 0.01) // drop dust
    .sort((a, b) => b.currentValueUsd - a.currentValueUsd);

  const solValueUsd = solBalance * solPrice;
  const cashUsd = solValueUsd + usdcBalance; // USDC ≈ $1
  const positionsValueUsd = positions.reduce((s, p) => s + p.currentValueUsd, 0);
  const totalValueUsd = cashUsd + positionsValueUsd;

  // 24h change from net-worth snapshots (sampled on trades).
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
      solBalance,
      usdcBalance,
      solPriceUsd: solPrice,
    },
    positions,
  };
}

/**
 * Reconstruct each token's weighted-average entry price (USD) from the trade
 * ledger, so we can show real PnL against on-chain holdings.
 */
function computeAvgEntries(trades: TradeRecord[]): Map<string, number> {
  const acc = new Map<string, { amount: number; cost: number }>();
  // Ledger is newest-first; replay oldest-first.
  for (const t of [...trades].reverse()) {
    const cur = acc.get(t.tokenAddress) ?? { amount: 0, cost: 0 };
    if (t.side === "buy") {
      cur.amount += t.tokenAmount;
      cur.cost += t.valueUsd;
    } else {
      const avg = cur.amount > 0 ? cur.cost / cur.amount : 0;
      cur.amount = Math.max(0, cur.amount - t.tokenAmount);
      cur.cost = avg * cur.amount; // keep avg constant on sells
    }
    acc.set(t.tokenAddress, cur);
  }
  const out = new Map<string, number>();
  for (const [addr, v] of acc) if (v.amount > 1e-9) out.set(addr, v.cost / v.amount);
  return out;
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

  // NOTE: paper-trading path — replaced by real on-chain swaps in Phase B.
  return trade;
}

export interface RecordTradeInput {
  signedTransaction: string; // base64
  token: TradeToken;
  side: TradeSide;
  /** Memecoin amount bought (buy) or sold (sell), UI units. */
  tokenAmount: number;
  payAsset: "SOL" | "USDC";
  marketCapUsd?: number | null;
  trader?: UserInfo;
}

/**
 * Broadcast a client-signed swap, confirm it, and record it in the ledger.
 * Returns the on-chain signature + the trade row.
 */
export async function recordRealTrade(userId: string, input: RecordTradeInput) {
  const store = getStore();
  await store.ensureUser(userId, input.trader);

  const signature = await broadcastAndConfirm(input.signedTransaction);

  const priceUsd = await getPrice(input.token.address);
  const valueUsd = input.tokenAmount * priceUsd;

  const trade = await store.logTrade({
    userId,
    token: input.token,
    side: input.side,
    tokenAmount: input.tokenAmount,
    priceUsd,
    valueUsd,
    marketCapUsd: input.marketCapUsd ?? null,
    payAsset: input.payAsset,
    txSignature: signature,
  });

  // Snapshot net worth from the (now updated) on-chain balances.
  if (input.trader?.walletAddress) {
    const { summary } = await getAccountView(userId, input.trader.walletAddress);
    await store.snapshotNetworth(userId, summary.totalValueUsd);
  }

  return { signature, trade };
}

export async function getActivity(userId: string, limit = 50): Promise<TradeRecord[]> {
  return getStore().getTrades(userId, limit);
}

/** Global activity feed: recent trades across all users, paginated. */
export async function getFeed(limit: number, offset: number): Promise<FeedActivity[]> {
  return getStore().getRecentTrades(limit, offset);
}

/** Read the user's profile, seeding defaults (gmail-derived) on first access. */
export async function getOrInitProfile(userId: string, defaults: UserInfo) {
  const store = getStore();
  await store.ensureUser(userId, defaults);
  return store.getProfile(userId);
}

/** Update the user's username (profile edit). */
export async function setUsername(userId: string, handle: string): Promise<void> {
  await getStore().ensureUser(userId);
  await getStore().updateUsername(userId, handle);
}

/** Set the user's avatar URL after a successful upload. */
export async function setAvatar(userId: string, avatarUrl: string): Promise<void> {
  await getStore().ensureUser(userId);
  await getStore().updateAvatar(userId, avatarUrl);
}

export async function getNetworth(userId: string): Promise<NetworthPoint[]> {
  return getStore().getNetworthSeries(userId);
}
