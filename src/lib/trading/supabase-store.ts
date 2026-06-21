import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { NetworthPoint, Position, TradeRecord } from "@/types/trading";
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
  async ensureUser(userId, walletAddress) {
    const db = getSupabaseAdmin();
    await db
      .from("users")
      .upsert(
        { id: userId, wallet_address: walletAddress ?? null, cash_usd: STARTING_CASH_USD },
        { onConflict: "id", ignoreDuplicates: true },
      );
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
      side: row.side as TradeRecord["side"],
      tokenAmount: n(row.token_amount),
      priceUsd: n(row.price_usd),
      valueUsd: n(row.value_usd),
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

  async snapshotNetworth(userId, valueUsd) {
    const db = getSupabaseAdmin();
    await db.from("networth_snapshots").insert({ user_id: userId, value_usd: valueUsd });
  },
};
