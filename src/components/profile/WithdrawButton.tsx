"use client";
import { useState } from "react";
import { ArrowUpFromLine } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { useAccount } from "@/hooks/use-account";
import { useWithdraw } from "@/hooks/use-withdraw";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type Asset = "SOL" | "USDC";
const SOL_GAS_RESERVE = 0.01;

/** "Withdraw" button → modal to send SOL/USDC to an external Solana address. */
export function WithdrawButton() {
  const { authenticated } = useAuth();
  const { account } = useAccount(authenticated);
  const { withdraw, pending, error } = useWithdraw();
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState<Asset>("SOL");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [signature, setSignature] = useState<string | null>(null);

  const balance =
    asset === "SOL" ? (account?.solBalance ?? 0) : (account?.usdcBalance ?? 0);
  const max =
    asset === "SOL" ? Math.max(0, balance - SOL_GAS_RESERVE) : balance;
  const amt = Number(amount) || 0;
  const canSubmit =
    !pending && amt > 0 && amt <= balance && destination.trim().length >= 32;

  async function submit() {
    const sig = await withdraw({
      asset,
      amount: amt,
      destination: destination.trim(),
    });
    if (sig) {
      setSignature(sig);
      setAmount("");
      setDestination("");
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArrowUpFromLine className="size-4" />
        Withdraw
      </Button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setSignature(null);
        }}
        title="Withdraw crypto"
      >
        {signature ? (
          <div className="text-center">
            <p className="mb-2 text-sm text-up">Withdrawal sent!</p>
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noreferrer"
              className="break-all text-xs text-brand hover:underline"
            >
              View on Solscan
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-0.5 rounded-lg bg-canvas p-0.5">
              {(["SOL", "USDC"] as Asset[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAsset(a)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors",
                    asset === a
                      ? "bg-elevated text-foreground"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>Amount</span>
                <button
                  onClick={() => setAmount(String(Number(max.toFixed(6))))}
                  className="hover:text-foreground"
                >
                  Max {max.toFixed(asset === "SOL" ? 4 : 2)} {asset}
                </button>
              </div>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="0"
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-lg font-semibold focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">
                Destination (Solana address)
              </label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value.trim())}
                placeholder="Recipient address"
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 font-mono text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <Button
              onClick={submit}
              disabled={!canSubmit}
              className="w-full"
              size="lg"
            >
              {pending ? "Sending…" : `Withdraw ${asset}`}
            </Button>
            {error && <p className="text-center text-xs text-down">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
