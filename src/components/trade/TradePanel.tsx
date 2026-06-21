"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAccount } from "@/hooks/use-account";
import { useTrade } from "@/hooks/use-trade";
import { Button } from "@/components/ui/button";
import { cn, formatTokenPrice, formatUsd } from "@/lib/utils";
import type { TokenDetail } from "@/types/market";

type Side = "buy" | "sell";
const QUICK_USD = [10, 100, 500, 1000];
const QUICK_PCT = [25, 50, 100];

/** Buy/sell panel — paper trades at the live price via /api/trade. */
export function TradePanel({ token }: { token: TokenDetail }) {
  const { authenticated, login } = useAuth();
  const { account, positions } = useAccount(authenticated);
  const { placeTrade, pending, error } = useTrade();
  const [side, setSide] = useState<Side>("buy");
  const [usd, setUsd] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const position = useMemo(
    () => positions.find((p) => p.tokenAddress === token.address),
    [positions, token.address],
  );

  async function submit() {
    if (!authenticated) return login();
    const ok =
      side === "buy"
        ? await placeTrade({
            token: { address: token.address, symbol: token.symbol, logoURI: token.logoURI },
            side: "buy",
            usdAmount: Number(usd),
          })
        : await placeTrade({
            token: { address: token.address, symbol: token.symbol, logoURI: token.logoURI },
            side: "sell",
            sellFraction: (pct ?? 0) / 100,
          });
    if (ok) {
      setFlash(side === "buy" ? `Bought ${token.symbol}` : `Sold ${token.symbol}`);
      setUsd("");
      setPct(null);
      setTimeout(() => setFlash(null), 2500);
    }
  }

  const canSubmit =
    !pending &&
    (side === "buy" ? Number(usd) > 0 : Boolean(position) && (pct ?? 0) > 0);

  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      {/* Buy / Sell toggle */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-canvas p-1">
        {(["buy", "sell"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "rounded-md py-2 text-sm font-semibold capitalize transition-colors",
              side === s
                ? s === "buy"
                  ? "bg-positive text-positive-foreground"
                  : "bg-down text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {side === "buy" ? (
        <>
          <label className="mb-1 block text-xs text-muted">Amount (USD)</label>
          <div className="mb-2 flex items-center rounded-lg border border-line bg-canvas px-3">
            <span className="text-muted">$</span>
            <input
              inputMode="decimal"
              value={usd}
              onChange={(e) => setUsd(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent px-2 py-3 text-lg font-semibold focus:outline-none"
            />
          </div>
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {QUICK_USD.map((amt) => (
              <button
                key={amt}
                onClick={() => setUsd(String(amt))}
                className="rounded-md border border-line py-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                ${amt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <label className="mb-1 block text-xs text-muted">Sell amount</label>
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {QUICK_PCT.map((p) => (
              <button
                key={p}
                onClick={() => setPct(p)}
                className={cn(
                  "rounded-md border py-2 text-sm font-medium",
                  pct === p
                    ? "border-down text-down"
                    : "border-line text-muted hover:text-foreground",
                )}
              >
                {p}%
              </button>
            ))}
          </div>
          {position ? (
            <p className="mb-3 text-xs text-muted">
              Holding {position.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
              {token.symbol} · {formatUsd(position.currentValueUsd)}
            </p>
          ) : (
            <p className="mb-3 text-xs text-muted">You don&apos;t hold {token.symbol}.</p>
          )}
        </>
      )}

      <Button
        onClick={submit}
        disabled={authenticated && !canSubmit}
        variant={side === "buy" ? "positive" : "negative"}
        size="lg"
        className="w-full"
      >
        {!authenticated
          ? "Log in to trade"
          : pending
            ? "Placing…"
            : side === "buy"
              ? `Buy ${token.symbol}`
              : `Sell ${token.symbol}`}
      </Button>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted">
          {formatTokenPrice(token.priceUsd)} / {token.symbol}
        </span>
        {authenticated && account && (
          <span className="text-muted">{formatUsd(account.cashUsd)} cash</span>
        )}
      </div>

      {flash && <p className="mt-2 text-center text-xs text-up">{flash}</p>}
      {error && <p className="mt-2 text-center text-xs text-down">{error}</p>}
    </div>
  );
}
