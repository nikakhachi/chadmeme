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

/** Format a token quantity for display (handles huge memecoin balances). */
function fmtTokenAmount(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: n >= 1 ? 2 : 6 });
}

/** Clean numeric string for an input value (no commas, trimmed precision). */
function toInput(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return String(Number(n.toPrecision(8)));
}

/** Buy/sell panel — paper trades at the live price via /api/trade. */
export function TradePanel({ token }: { token: TokenDetail }) {
  const { authenticated, login } = useAuth();
  const { account, positions } = useAccount(authenticated);
  const { placeTrade, pending, error } = useTrade();
  const [side, setSide] = useState<Side>("buy");
  const [buyUsd, setBuyUsd] = useState("");
  const [sellTokens, setSellTokens] = useState("");
  const [sellUsd, setSellUsd] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const price = token.priceUsd;
  const position = useMemo(
    () => positions.find((p) => p.tokenAddress === token.address),
    [positions, token.address],
  );
  const holdings = position?.amount ?? 0;

  // Tokens received for the entered buy amount.
  const buyTokens = price > 0 ? Number(buyUsd || 0) / price : 0;

  // Two-way sync for the sell fields.
  function onSellTokens(value: string) {
    const clean = value.replace(/[^0-9.]/g, "");
    setSellTokens(clean);
    setSellUsd(clean ? (Number(clean) * price).toFixed(2) : "");
  }
  function onSellUsd(value: string) {
    const clean = value.replace(/[^0-9.]/g, "");
    setSellUsd(clean);
    setSellTokens(clean && price > 0 ? toInput(Number(clean) / price) : "");
  }
  function setSellPct(pct: number) {
    const amount = (holdings * pct) / 100;
    setSellTokens(toInput(amount));
    setSellUsd(amount ? (amount * price).toFixed(2) : "");
  }

  async function submit() {
    if (!authenticated) return login();
    const t = {
      address: token.address,
      symbol: token.symbol,
      logoURI: token.logoURI,
      marketCap: token.marketCap,
    };
    const ok =
      side === "buy"
        ? await placeTrade({ token: t, side: "buy", usdAmount: Number(buyUsd) })
        : await placeTrade({ token: t, side: "sell", tokenAmount: Number(sellTokens) });
    if (ok) {
      setFlash(side === "buy" ? `Bought ${token.symbol}` : `Sold ${token.symbol}`);
      setBuyUsd("");
      setSellTokens("");
      setSellUsd("");
      setTimeout(() => setFlash(null), 2500);
    }
  }

  const canSubmit =
    !pending &&
    (side === "buy"
      ? Number(buyUsd) > 0
      : Number(sellTokens) > 0 && holdings > 0);

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
          <div className="flex items-center rounded-lg border border-line bg-canvas px-3">
            <span className="text-muted">$</span>
            <input
              inputMode="decimal"
              value={buyUsd}
              onChange={(e) => setBuyUsd(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent px-2 py-3 text-lg font-semibold focus:outline-none"
            />
          </div>
          {/* Tokens received */}
          <div className="mt-1.5 flex justify-between text-xs text-muted">
            <span>You receive</span>
            <span className="font-medium text-foreground">
              ≈ {fmtTokenAmount(buyTokens)} {token.symbol}
            </span>
          </div>
          <div className="mb-3 mt-2 grid grid-cols-4 gap-1.5">
            {QUICK_USD.map((amt) => (
              <button
                key={amt}
                onClick={() => setBuyUsd(String(amt))}
                className="rounded-md border border-line py-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                ${amt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Percentage shortcuts */}
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {QUICK_PCT.map((p) => (
              <button
                key={p}
                onClick={() => setSellPct(p)}
                disabled={holdings <= 0}
                className="rounded-md border border-line py-1.5 text-xs font-medium text-muted hover:text-foreground disabled:opacity-40"
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Token amount */}
          <label className="mb-1 block text-xs text-muted">Sell ({token.symbol})</label>
          <div className="mb-2 flex items-center rounded-lg border border-line bg-canvas px-3">
            <input
              inputMode="decimal"
              value={sellTokens}
              onChange={(e) => onSellTokens(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent px-1 py-2.5 text-base font-semibold focus:outline-none"
            />
            <span className="text-xs text-muted">{token.symbol}</span>
          </div>

          {/* Cash received */}
          <label className="mb-1 block text-xs text-muted">You receive (USD)</label>
          <div className="flex items-center rounded-lg border border-line bg-canvas px-3">
            <span className="text-muted">$</span>
            <input
              inputMode="decimal"
              value={sellUsd}
              onChange={(e) => onSellUsd(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent px-2 py-2.5 text-base font-semibold focus:outline-none"
            />
          </div>

          <p className="mb-3 mt-2 text-xs text-muted">
            {holdings > 0
              ? `Holding ${fmtTokenAmount(holdings)} ${token.symbol} · ${formatUsd(position?.currentValueUsd ?? 0)}`
              : `You don't hold ${token.symbol}.`}
          </p>
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
