"use client";
import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { useAccount } from "@/hooks/use-account";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useConvert } from "@/hooks/use-convert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AssetIcon } from "@/components/ui/asset-icon";

type Asset = "SOL" | "USDC";
const SOL_GAS_RESERVE = 0.005;

/** Convert (swap) SOL ⇄ USDC inside the user's own wallet. */
export function ConvertButton() {
  const { authenticated } = useAuth();
  const { account } = useAccount(authenticated);
  const { solBalance, usdcBalance } = useWalletBalance();
  const { convert, pending, error } = useConvert();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Asset>("SOL");
  const [amount, setAmount] = useState("");

  const to: Asset = from === "SOL" ? "USDC" : "SOL";
  const solPrice = account?.solPriceUsd ?? 0;
  const balance = from === "SOL" ? solBalance : usdcBalance;
  const max = from === "SOL" ? Math.max(0, balance - SOL_GAS_RESERVE) : balance;
  const amt = Number(amount) || 0;
  const estOut = from === "SOL" ? amt * solPrice : solPrice > 0 ? amt / solPrice : 0;
  const canSubmit = !pending && amt > 0 && amt <= balance;

  function flip() {
    setFrom(to);
    setAmount("");
  }

  async function submit() {
    const ok = await convert(from, amt);
    if (ok) {
      setAmount("");
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArrowDownUp className="size-4" />
        Convert
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Convert SOL ⇄ USDC">
        <div className="space-y-3">
          {/* From */}
          <div className="rounded-lg border border-line bg-canvas p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>From</span>
              <button onClick={() => setAmount(String(Number(max.toFixed(6))))} className="hover:text-foreground">
                Max {max.toFixed(from === "SOL" ? 4 : 2)}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold">
                <AssetIcon asset={from} className="size-4" /> {from}
              </span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                className="w-full bg-transparent text-right text-lg font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={flip}
              aria-label="Flip direction"
              className="rounded-full border border-line bg-elevated p-1.5 text-muted hover:text-foreground"
            >
              <ArrowDownUp className="size-4" />
            </button>
          </div>

          {/* To (estimate) */}
          <div className="rounded-lg border border-line bg-canvas p-3">
            <div className="mb-1 text-xs text-muted">To (estimated)</div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <AssetIcon asset={to} className="size-4" /> {to}
              </span>
              <span className="text-lg font-semibold text-foreground">
                ≈ {estOut.toLocaleString("en-US", { maximumFractionDigits: to === "SOL" ? 4 : 2 })}
              </span>
            </div>
          </div>

          <Button onClick={submit} disabled={!canSubmit} className="w-full" size="lg">
            {pending ? "Converting…" : `Convert to ${to}`}
          </Button>
          {error && <p className="text-center text-xs text-down">{error}</p>}
        </div>
      </Modal>
    </>
  );
}
