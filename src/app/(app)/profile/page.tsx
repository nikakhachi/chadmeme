"use client";
import { useAuth } from "@/components/auth/auth-context";
import { useAccount } from "@/hooks/use-account";
import { useNetworth } from "@/hooks/use-profile-data";
import { NetworthChart } from "@/components/profile/NetworthChart";
import { ActivityHistory } from "@/components/profile/ActivityHistory";
import { PositionsList } from "@/components/profile/PositionsList";
import { DepositCard } from "@/components/profile/DepositCard";
import { Button } from "@/components/ui/button";
import { PriceChange } from "@/components/ui/price-change";
import { formatUsd } from "@/lib/utils";

/** User profile: net-worth chart, holdings, activity history, and deposits. */
export default function ProfilePage() {
  const { ready, authenticated, user, login } = useAuth();
  const { account, positions } = useAccount(authenticated);
  const { points } = useNetworth();

  if (ready && !authenticated) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="mb-3 text-muted">Log in to view your profile.</p>
          <Button onClick={login}>Log in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-brand text-xl font-bold text-brand-foreground">
          {(user?.handle ?? "C").slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1 className="text-xl font-bold">{user?.handle ?? "Trader"}</h1>
          <p className="text-sm text-muted">Paper trading account</p>
        </div>
      </div>

      {/* Net worth */}
      <div className="mb-6 rounded-xl border border-line bg-panel p-5">
        <div className="mb-1 text-sm text-muted">Net worth</div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">{formatUsd(account?.totalValueUsd ?? 0)}</span>
          {account && (
            <span className="text-sm">
              <PriceChange value={account.change24hPercent} />{" "}
              <span className="text-muted">24h</span>
            </span>
          )}
        </div>
        <div className="mt-1 flex gap-4 text-xs text-muted">
          <span>Cash {formatUsd(account?.cashUsd ?? 0)}</span>
          <span>Positions {formatUsd(account?.positionsValueUsd ?? 0)}</span>
        </div>
        <div className="mt-4 h-56">
          <NetworthChart points={points} />
        </div>
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Section title="Holdings">
            <PositionsList positions={positions} />
          </Section>
          <Section title="Activity">
            <ActivityHistory />
          </Section>
        </div>
        <div className="space-y-6">
          <DepositCard />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-4 py-3 text-sm font-bold">{title}</div>
      {children}
    </div>
  );
}
