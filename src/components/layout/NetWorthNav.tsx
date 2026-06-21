"use client";
import { useAuth } from "@/components/auth/auth-context";
import { useAccount } from "@/hooks/use-account";
import { AssetIcon } from "@/components/ui/asset-icon";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { formatUsd } from "@/lib/utils";

/**
 * Top-bar net-worth value. Hovering reveals the breakdown: SOL, USDC, then
 * each token position.
 */
export function NetWorthNav() {
  const { authenticated } = useAuth();
  const { account, positions } = useAccount(authenticated);
  if (!account) return null;

  const solUsd = account.solBalance * account.solPriceUsd;

  return (
    <div className="group relative hidden sm:block">
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wide text-muted">Net worth</div>
        <div className="text-sm font-semibold">{formatUsd(account.totalValueUsd)}</div>
      </div>

      {/* Hover breakdown */}
      <div className="invisible absolute right-0 top-full z-50 w-60 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
        <div className="overflow-hidden rounded-xl border border-line bg-panel py-1 shadow-xl">
          <Row
            icon={<AssetIcon asset="SOL" className="size-5" />}
            label="SOL"
            sub={`${account.solBalance.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`}
            value={solUsd}
          />
          <Row
            icon={<AssetIcon asset="USDC" className="size-5" />}
            label="USDC"
            sub={`${account.usdcBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`}
            value={account.usdcBalance}
          />
          {positions.length > 0 && <div className="my-1 border-t border-line" />}
          {positions.map((p) => (
            <Row
              key={p.id}
              icon={<TokenAvatar symbol={p.tokenSymbol} logoURI={p.tokenLogoURI ?? undefined} size="sm" />}
              label={p.tokenSymbol}
              sub={`${p.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              value={p.currentValueUsd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  sub,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{label}</div>
        <div className="truncate text-xs text-muted">{sub}</div>
      </div>
      <div className="text-sm font-medium">{formatUsd(value)}</div>
    </div>
  );
}
