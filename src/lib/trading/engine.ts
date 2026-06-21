/**
 * Pure paper-trading math — no I/O, fully unit-testable.
 *
 * These helpers compute the next account state for a buy/sell. The store layer
 * (memory or Supabase) persists the results. Keeping the math here means real
 * on-chain execution can reuse the same position/PnL accounting later.
 */
import type { Position, PositionWithPnl } from "@/types/trading";
import type { TradeSide } from "@/types/market";

/** Virtual cash granted to a new paper-trading account. */
export const STARTING_CASH_USD = 10_000;

export interface TradeInput {
  side: TradeSide;
  tokenAmount: number;
  priceUsd: number;
}

export class TradeError extends Error {}

/** Result of applying a trade: the new cash and the next position (or null if closed). */
export interface AppliedTrade {
  cashUsd: number;
  position: Pick<Position, "amount" | "avgEntryPriceUsd" | "costBasisUsd"> | null;
  valueUsd: number;
}

/**
 * Apply a buy/sell to current cash + position, returning the next state.
 * Throws TradeError on insufficient cash (buy) or insufficient tokens (sell).
 */
export function applyTrade(
  cashUsd: number,
  position: Pick<Position, "amount" | "avgEntryPriceUsd" | "costBasisUsd"> | null,
  { side, tokenAmount, priceUsd }: TradeInput,
): AppliedTrade {
  if (tokenAmount <= 0 || priceUsd <= 0) {
    throw new TradeError("Invalid trade amount.");
  }
  const valueUsd = tokenAmount * priceUsd;
  const held = position?.amount ?? 0;

  if (side === "buy") {
    if (valueUsd > cashUsd + 1e-6) {
      throw new TradeError("Insufficient cash balance.");
    }
    const newAmount = held + tokenAmount;
    const newCostBasis = (position?.costBasisUsd ?? 0) + valueUsd;
    return {
      cashUsd: cashUsd - valueUsd,
      position: {
        amount: newAmount,
        avgEntryPriceUsd: newCostBasis / newAmount,
        costBasisUsd: newCostBasis,
      },
      valueUsd,
    };
  }

  // sell
  if (tokenAmount > held + 1e-6) {
    throw new TradeError("Insufficient token balance.");
  }
  const remaining = held - tokenAmount;
  const avgEntry = position?.avgEntryPriceUsd ?? 0;
  if (remaining <= 1e-9) {
    return { cashUsd: cashUsd + valueUsd, position: null, valueUsd };
  }
  return {
    cashUsd: cashUsd + valueUsd,
    position: {
      amount: remaining,
      avgEntryPriceUsd: avgEntry,
      costBasisUsd: avgEntry * remaining,
    },
    valueUsd,
  };
}

/** Enrich a stored position with live price to compute current value and PnL. */
export function withPnl(position: Position, currentPriceUsd: number): PositionWithPnl {
  const currentValueUsd = position.amount * currentPriceUsd;
  const pnlUsd = currentValueUsd - position.costBasisUsd;
  const pnlPercent =
    position.costBasisUsd > 0 ? (pnlUsd / position.costBasisUsd) * 100 : 0;
  return { ...position, currentPriceUsd, currentValueUsd, pnlUsd, pnlPercent };
}
