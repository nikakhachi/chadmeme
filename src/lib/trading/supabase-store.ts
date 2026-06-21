import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  FeedActivity,
  NetworthPoint,
  Position,
  TradeRecord,
  TransferRecord,
} from "@/types/trading";
import { applyTrade, STARTING_CASH_USD } from "./engine";
import type { TradingStore } from "./store";

/**
 * Durable paper-trading store backed by Supabase/Postgres. Reuses the same
 * `applyTrade` math as the in-memory store so behavior is identical.
 *
 * Note: recordTrade reads then writes in steps (no SQL transaction). For a
 * single-user paper account this is fine; promote to a Postgres function if
 * concurrent writes per user become a concern.
 */

// Postgres `numeric` is serialized as a string by PostgREST — coerce on read.
const n = (v: unknown) => Number(v ?? 0);

function rowToPosition(row: Record<string, unknown>): Position {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    tokenAddress: String(row.token_address),
    tokenSymbol: String(row.token_symbol),
    tokenLogoURI: (row.token_logo_uri as string) ?? undefined,
    amount: n(row.amount),
    avgEntryPriceUsd: n(row.avg_entry_usd),
    costBasisUsd: n(row.cost_basis_usd),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export const supabaseStore: TradingStore = {
  async ensureUser(userId, info) {
    const db = getSupabaseAdmin();
    const row: Record<string, unknown> = { id: userId };
    if (info?.handle) row.handle = info.handle;
    if (info?.walletAddress) row.wallet_address = info.walletAddress;
    await db.from("users").upsert(row, { onConflict: "id", ignoreDuplicates: true });
    // Backfill handle/wallet for rows that were created without them (e.g. by an
    // account fetch before the handle was known). Only fills NULLs — never
    // overwrites a user-edited username.
    if (info?.handle) {
      await db.from("users").update({ handle: info.handle }).eq("id", userId).is("handle", null);
    }
    if (info?.walletAddress) {
      await db
        .from("users")
        .update({ wallet_address: info.walletAddress })
        .eq("id", userId)
        .is("wallet_address", null);
    }
  },

  async getProfile(userId) {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("users")
      .select("handle, wallet_address, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    return {
      handle: (data?.handle as string) ?? null,
      walletAddress: (data?.wallet_address as string) ?? null,
      avatarUrl: (data?.avatar_url as string) ?? null,
    };
  },

  async updateUsername(userId, handle) {
    const db = getSupabaseAdmin();
    await db.from("users").update({ handle }).eq("id", userId);
  },

  async updateAvatar(userId, avatarUrl) {
    const db = getSupabaseAdmin();
    await db.from("users").update({ avatar_url: avatarUrl }).eq("id", userId);
  },

  async getRecentTrades(limit, offset) {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("trades")
      .select("*, users(handle, wallet_address, avatar_url)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    return (data ?? []).map((row): FeedActivity => {
      const user = (row.users ?? {}) as {
        handle?: string;
        wallet_address?: string;
        avatar_url?: string;
      };
      return {
        id: String(row.id),
        traderId: String(row.user_id),
        traderHandle: user.handle ?? null,
        traderWallet: user.wallet_address ?? null,
        traderAvatarUrl: user.avatar_url ?? null,
        tokenAddress: String(row.token_address),
        tokenSymbol: String(row.token_symbol),
        tokenLogoURI: (row.token_logo_uri as string) ?? null,
        side: row.side as FeedActivity["side"],
        tokenAmount: n(row.token_amount),
        valueUsd: n(row.value_usd),
        marketCapUsd: row.market_cap == null ? null : n(row.market_cap),
        payAsset: (row.pay_asset as FeedActivity["payAsset"]) ?? null,
        createdAt: String(row.created_at),
      };
    });
  },

  async getCash(userId) {
    const db = getSupabaseAdmin();
    const { data } = await db.from("users").select("cash_usd").eq("id", userId).single();
    return n(data?.cash_usd ?? STARTING_CASH_USD);
  },

  async getPositions(userId) {
    const db = getSupabaseAdmin();
    const { data } = await db.from("positions").select("*").eq("user_id", userId);
    return (data ?? []).map(rowToPosition);
  },

  async getPosition(userId, tokenAddress) {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("positions")
      .select("*")
      .eq("user_id", userId)
      .eq("token_address", tokenAddress)
      .maybeSingle();
    return data ? rowToPosition(data) : null;
  },

  async getTrades(userId, limit = 50) {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      tokenAddress: String(row.token_address),
      tokenSymbol: String(row.token_symbol),
      tokenLogoURI: (row.token_logo_uri as string) ?? null,
      side: row.side as TradeRecord["side"],
      tokenAmount: n(row.token_amount),
      priceUsd: n(row.price_usd),
      valueUsd: n(row.value_usd),
      marketCapUsd: row.market_cap == null ? null : n(row.market_cap),
      payAsset: (row.pay_asset as TradeRecord["payAsset"]) ?? null,
      txSignature: (row.tx_signature as string) ?? null,
      createdAt: String(row.created_at),
    }));
  },

  async getNetworthSeries(userId) {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("networth_snapshots")
      .select("value_usd, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(500);
    return (data ?? []).map(
      (row): NetworthPoint => ({
        time: Math.floor(new Date(String(row.created_at)).getTime() / 1000),
        valueUsd: n(row.value_usd),
      }),
    );
  },

  async recordTrade({ userId, token, side, tokenAmount, priceUsd }) {
    const db = getSupabaseAdmin();
    const cash = await this.getCash(userId);
    const existing = await this.getPosition(userId, token.address);

    const result = applyTrade(cash, existing, { side, tokenAmount, priceUsd });

    await db.from("users").update({ cash_usd: result.cashUsd }).eq("id", userId);

    if (result.position === null) {
      await db.from("positions").delete().eq("user_id", userId).eq("token_address", token.address);
    } else {
      await db.from("positions").upsert(
        {
          user_id: userId,
          token_address: token.address,
          token_symbol: token.symbol,
          token_logo_uri: token.logoURI ?? null,
          amount: result.position.amount,
          avg_entry_usd: result.position.avgEntryPriceUsd,
          cost_basis_usd: result.position.costBasisUsd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,token_address" },
      );
    }

    const { data, error } = await db
      .from("trades")
      .insert({
        user_id: userId,
        token_address: token.address,
        token_symbol: token.symbol,
        side,
        token_amount: tokenAmount,
        price_usd: priceUsd,
        value_usd: result.valueUsd,
        market_cap: token.marketCap ?? null,
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to record trade");

    return {
      id: String(data.id),
      userId,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      side,
      tokenAmount,
      priceUsd,
      valueUsd: result.valueUsd,
      createdAt: String(data.created_at),
    };
  },

  async logTrade({ userId, token, side, tokenAmount, priceUsd, valueUsd, marketCapUsd, payAsset, txSignature }) {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("trades")
      .insert({
        user_id: userId,
        token_address: token.address,
        token_symbol: token.symbol,
        token_logo_uri: token.logoURI ?? null,
        side,
        token_amount: tokenAmount,
        price_usd: priceUsd,
        value_usd: valueUsd,
        market_cap: marketCapUsd ?? null,
        pay_asset: payAsset,
        tx_signature: txSignature,
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to log trade");
    return {
      id: String(data.id),
      userId,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      side,
      tokenAmount,
      priceUsd,
      valueUsd,
      marketCapUsd: marketCapUsd ?? null,
      createdAt: String(data.created_at),
    };
  },

  async logTransfer({ userId, kind, asset, amount, toAsset, toAmount, txSignature }) {
    const db = getSupabaseAdmin();
    await db.from("transfers").insert({
      user_id: userId,
      kind,
      asset,
      amount,
      to_asset: toAsset ?? null,
      to_amount: toAmount ?? null,
      tx_signature: txSignature,
    });
  },

  async getTransfers(userId, limit = 50) {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("transfers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map(
      (row): TransferRecord => ({
        id: String(row.id),
        kind: row.kind as TransferRecord["kind"],
        asset: row.asset as TransferRecord["asset"],
        amount: n(row.amount),
        toAsset: (row.to_asset as TransferRecord["toAsset"]) ?? null,
        toAmount: row.to_amount == null ? null : n(row.to_amount),
        txSignature: (row.tx_signature as string) ?? null,
        createdAt: String(row.created_at),
      }),
    );
  },

  async snapshotNetworth(userId, valueUsd) {
    const db = getSupabaseAdmin();
    await db.from("networth_snapshots").insert({ user_id: userId, value_usd: valueUsd });
  },
};
