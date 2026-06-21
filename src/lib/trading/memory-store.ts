import "server-only";
import { randomUUID } from "crypto";
import type { FeedActivity, NetworthPoint, Position, TradeRecord } from "@/types/trading";
import { applyTrade, STARTING_CASH_USD } from "./engine";
import type { TradingStore } from "./store";

/**
 * In-process paper-trading store. State lives in module-level Maps and resets
 * when the server restarts — perfect for demos and local dev. The Supabase
 * store replaces this for durable, multi-instance persistence.
 */
interface UserState {
  cashUsd: number;
  handle: string | null;
  walletAddress: string | null;
  avatarUrl: string | null;
  positions: Map<string, Position>;
  trades: TradeRecord[];
  networth: NetworthPoint[];
}

const users = new Map<string, UserState>();

function ensure(userId: string): UserState {
  let state = users.get(userId);
  if (!state) {
    state = {
      cashUsd: STARTING_CASH_USD,
      handle: null,
      walletAddress: null,
      avatarUrl: null,
      positions: new Map(),
      trades: [],
      networth: [
        { time: Math.floor(Date.now() / 1000), valueUsd: STARTING_CASH_USD },
      ],
    };
    users.set(userId, state);
  }
  return state;
}

export const memoryStore: TradingStore = {
  async ensureUser(userId, info) {
    const state = ensure(userId);
    // Seed only when unset, so we never clobber an edited username.
    if (info?.handle && !state.handle) state.handle = info.handle;
    if (info?.walletAddress && !state.walletAddress) state.walletAddress = info.walletAddress;
  },

  async getProfile(userId) {
    const state = ensure(userId);
    return {
      handle: state.handle,
      walletAddress: state.walletAddress,
      avatarUrl: state.avatarUrl,
    };
  },

  async updateUsername(userId, handle) {
    ensure(userId).handle = handle;
  },

  async updateAvatar(userId, avatarUrl) {
    ensure(userId).avatarUrl = avatarUrl;
  },

  async getRecentTrades(limit, offset) {
    const all: FeedActivity[] = [];
    for (const [userId, state] of users) {
      for (const t of state.trades) {
        all.push({
          id: t.id,
          traderId: userId,
          traderHandle: state.handle,
          traderWallet: state.walletAddress,
          traderAvatarUrl: state.avatarUrl,
          tokenAddress: t.tokenAddress,
          tokenSymbol: t.tokenSymbol,
          side: t.side,
          tokenAmount: t.tokenAmount,
          valueUsd: t.valueUsd,
          marketCapUsd: t.marketCapUsd ?? null,
          payAsset: t.payAsset ?? null,
          createdAt: t.createdAt,
        });
      }
    }
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all.slice(offset, offset + limit);
  },

  async getCash(userId) {
    return ensure(userId).cashUsd;
  },

  async getPositions(userId) {
    return [...ensure(userId).positions.values()];
  },

  async getPosition(userId, tokenAddress) {
    return ensure(userId).positions.get(tokenAddress) ?? null;
  },

  async getTrades(userId, limit = 50) {
    return ensure(userId).trades.slice(0, limit);
  },

  async getNetworthSeries(userId) {
    return ensure(userId).networth;
  },

  async recordTrade({ userId, token, side, tokenAmount, priceUsd }) {
    const state = ensure(userId);
    const existing = state.positions.get(token.address) ?? null;

    const result = applyTrade(state.cashUsd, existing, {
      side,
      tokenAmount,
      priceUsd,
    });
    state.cashUsd = result.cashUsd;

    if (result.position === null) {
      state.positions.delete(token.address);
    } else {
      const now = new Date().toISOString();
      state.positions.set(token.address, {
        id: existing?.id ?? randomUUID(),
        userId,
        tokenAddress: token.address,
        tokenSymbol: token.symbol,
        tokenLogoURI: token.logoURI,
        amount: result.position.amount,
        avgEntryPriceUsd: result.position.avgEntryPriceUsd,
        costBasisUsd: result.position.costBasisUsd,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
    }

    const trade: TradeRecord = {
      id: randomUUID(),
      userId,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      side,
      tokenAmount,
      priceUsd,
      valueUsd: result.valueUsd,
      marketCapUsd: token.marketCap ?? null,
      createdAt: new Date().toISOString(),
    };
    state.trades.unshift(trade);
    return trade;
  },

  async logTrade({ userId, token, side, tokenAmount, priceUsd, valueUsd, marketCapUsd, payAsset }) {
    const state = ensure(userId);
    const trade: TradeRecord = {
      id: randomUUID(),
      userId,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      side,
      tokenAmount,
      priceUsd,
      valueUsd,
      marketCapUsd: marketCapUsd ?? null,
      payAsset,
      createdAt: new Date().toISOString(),
    };
    state.trades.unshift(trade);
    return trade;
  },

  async snapshotNetworth(userId, valueUsd) {
    const state = ensure(userId);
    state.networth.push({
      time: Math.floor(Date.now() / 1000),
      valueUsd,
    });
    // Keep the series bounded.
    if (state.networth.length > 500) state.networth.shift();
  },
};
