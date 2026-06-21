import "server-only";
import { randomUUID } from "crypto";
import type { FeedActivity, NetworthPoint, TradeRecord } from "@/types/trading";
import type { TradingStore } from "./store";

/**
 * In-process store used only when Supabase isn't configured (dev fallback).
 * State lives in module-level Maps and resets on server restart.
 */
interface UserState {
  handle: string | null;
  walletAddress: string | null;
  avatarUrl: string | null;
  trades: TradeRecord[];
  networth: NetworthPoint[];
}

const users = new Map<string, UserState>();

function ensure(userId: string): UserState {
  let state = users.get(userId);
  if (!state) {
    state = { handle: null, walletAddress: null, avatarUrl: null, trades: [], networth: [] };
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
          tokenLogoURI: t.tokenLogoURI ?? null,
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

  async getTrades(userId, limit = 50) {
    return ensure(userId).trades.slice(0, limit);
  },

  async getNetworthSeries(userId) {
    return ensure(userId).networth;
  },

  async logTrade({ userId, token, side, tokenAmount, priceUsd, valueUsd, marketCapUsd, payAsset, txSignature }) {
    const state = ensure(userId);
    const trade: TradeRecord = {
      id: randomUUID(),
      userId,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      tokenLogoURI: token.logoURI ?? null,
      side,
      tokenAmount,
      priceUsd,
      valueUsd,
      marketCapUsd: marketCapUsd ?? null,
      payAsset,
      txSignature,
      createdAt: new Date().toISOString(),
    };
    state.trades.unshift(trade);
    return trade;
  },

  async logTransfer() {
    // Transfers are only meaningful with the durable (Supabase) store.
  },

  async getTransfers() {
    return [];
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
