"use client";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { SolIcon, UsdcIcon } from "./asset-icon";
import { cn } from "@/lib/utils";

function fmt(n: number, asset: "SOL" | "USDC"): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: asset === "SOL" ? 3 : 2 });
}

/** Live SOL + USDC wallet balances shown as two labeled, icon'd values. */
export function BalancePills({ className }: { className?: string }) {
  const { solBalance, usdcBalance } = useWalletBalance();
  return (
    <div className={cn("flex items-center gap-2 text-sm font-semibold", className)}>
      <span className="flex items-center gap-1">
        <SolIcon className="size-4" /> {fmt(solBalance, "SOL")}
      </span>
      <span className="text-line">·</span>
      <span className="flex items-center gap-1">
        <UsdcIcon className="size-4" /> {fmt(usdcBalance, "USDC")}
      </span>
    </div>
  );
}
