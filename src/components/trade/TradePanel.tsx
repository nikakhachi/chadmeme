"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAccount } from "@/hooks/use-account";
import { useExecuteTrade } from "@/hooks/use-execute-trade";
import { Button } from "@/components/ui/button";
import { cn, formatTokenPrice, formatUsd } from "@/lib/utils";
import type { TokenDetail } from "@/types/market";

type Side = "buy" | "sell";
type PayAsset = "SOL" | "USDC";
const PERCENTS = [25, 50, 100];
const SOL_GAS_RESERVE = 0.01; // keep a little SOL for fees on "max" buys

function fmtAmount(n: number, max = 6): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: n >= 1 ? 4 : max });
}

/** Buy/sell panel — real on-chain swaps (Jupiter) paid with SOL or USDC. */
export function TradePanel({ token }: { token: TokenDetail }) {
  const { authenticated, login } = useAuth();
  const { account, positions } = useAccount(authenticated);
  const { placeTrade, pending, error } = useExecuteTrade();
  const [side, setSide] = useState<Side>("buy");
  const [payAsset, setPayAsset] = useState<PayAsset>("SOL");
  const [amount, setAmount] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const position = useMemo(
    () => positions.find((p) => p.tokenAddress === token.address),
    [positions, token.address],
  );
  const holding = position?.amount ?? 0;

  const solPrice = account?.solPriceUsd ?? 0;
  const payBalance = payAsset === "SOL" ? account?.solBalance ?? 0 : account?.usdcBalance ?? 0;
  const payPrice = payAsset === "SOL" ? solPrice : 1;
  const amt = Number(amount) || 0;

  // Local estimate (the real fill comes from the swap). Buy: tokens received.
  // Sell: pay-asset received.
  const estReceive = useMemo(() => {
    if (side === "buy") {
      const usd = amt * payPrice;
      return token.priceUsd > 0 ? usd / token.priceUsd : 0;
    }
    const usd = amt * token.priceUsd;
    return payPrice > 0 ? usd / payPrice : 0;
  }, [side, amt, payPrice, token.priceUsd]);

  function setPercent(pct: number) {
    if (side === "buy") {
      let max = payBalance;
      if (payAsset === "SOL") max = Math.max(0, payBalance - SOL_GAS_RESERVE);
      setAmount(String(Number(((max * pct) / 100).toFixed(6))));
    } else {
      setAmount(String(Number(((holding * pct) / 100).toFixed(6))));
    }
  }

  async function submit() {
    if (!authenticated) return login();
    const ok = await placeTrade({
      side,
      token: {
        mint: token.address,
        decimals: token.decimals,
        symbol: token.symbol,
        logoURI: token.logoURI,
        marketCap: token.marketCap,
      },
      payAsset,
      amount: amt,
    });
    if (ok) {
      setFlash(side === "buy" ? `Bought ${token.symbol}` : `Sold ${token.symbol}`);
      setAmount("");
      setTimeout(() => setFlash(null), 3000);
    }
  }

  const canSubmit =
    !pending &&
    amt > 0 &&
    (side === "buy" ? amt <= payBalance : holding > 0 && amt <= holding + 1e-9);

  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      {/* Buy / Sell */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-canvas p-1">
        {(["buy", "sell"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSide(s);
              setAmount("");
            }}
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

      {/* Pay-with asset */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          {side === "buy" ? "Pay with" : "Receive"}
        </span>
        <div className="flex gap-0.5 rounded-lg bg-canvas p-0.5">
          {(["SOL", "USDC"] as PayAsset[]).map((a) => (
            <button
              key={a}
              onClick={() => setPayAsset(a)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                payAsset === a ? "bg-elevated text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <label className="mb-1 block text-xs text-muted">
        {side === "buy" ? `Amount (${payAsset})` : `Sell (${token.symbol})`}
      </label>
      <div className="flex items-center rounded-lg border border-line bg-canvas px-3">
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          className="w-full bg-transparent px-1 py-3 text-lg font-semibold focus:outline-none"
        />
        <span className="text-xs text-muted">{side === "buy" ? payAsset : token.symbol}</span>
      </div>

      <div className="mb-2 mt-2 grid grid-cols-3 gap-1.5">
        {PERCENTS.map((p) => (
          <button
            key={p}
            onClick={() => setPercent(p)}
            className="rounded-md border border-line py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            {p === 100 ? "Max" : `${p}%`}
          </button>
        ))}
      </div>

      {/* Estimate */}
      <div className="mb-3 flex justify-between text-xs text-muted">
        <span>You receive</span>
        <span className="font-medium text-foreground">
          ≈ {fmtAmount(estReceive)} {side === "buy" ? token.symbol : payAsset}
        </span>
      </div>

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
            ? "Swapping…"
            : side === "buy"
              ? `Buy ${token.symbol}`
              : `Sell ${token.symbol}`}
      </Button>

      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>{formatTokenPrice(token.priceUsd)} / {token.symbol}</span>
        {authenticated && account && (
          <span>
            {side === "sell"
              ? `${fmtAmount(holding)} ${token.symbol}`
              : `${fmtAmount(payBalance)} ${payAsset}`}
          </span>
        )}
      </div>

      {authenticated && account && (
        <div className="mt-1 text-right text-[11px] text-subtle">
          Balance: {fmtAmount(account.solBalance)} SOL · {formatUsd(account.usdcBalance)} USDC
        </div>
      )}

      {flash && <p className="mt-2 text-center text-xs text-up">{flash}</p>}
      {error && <p className="mt-2 text-center text-xs text-down">{error}</p>}
    </div>
  );
}
