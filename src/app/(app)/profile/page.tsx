"use client";
import { useAuth } from "@/components/auth/auth-context";
import { useAccount } from "@/hooks/use-account";
import { useNetworth } from "@/hooks/use-profile-data";
import { NetworthChart } from "@/components/profile/NetworthChart";
import { ActivityHistory } from "@/components/profile/ActivityHistory";
import { PositionsList } from "@/components/profile/PositionsList";
import { DepositButton } from "@/components/profile/DepositButton";
import { WithdrawButton } from "@/components/profile/WithdrawButton";
import { ConvertButton } from "@/components/profile/ConvertButton";
import { AssetIcon } from "@/components/ui/asset-icon";
import { EditableUsername } from "@/components/profile/EditableUsername";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { Button } from "@/components/ui/button";
import { PriceChange } from "@/components/ui/price-change";
import { formatUsd } from "@/lib/utils";

/** User profile: net-worth chart, holdings, activity history, and deposits. */
export default function ProfilePage() {
  const { ready, authenticated, login } = useAuth();
  const {
    account,
    positions,
    isLoading: accountLoading,
  } = useAccount(authenticated);
  const { points } = useNetworth();

  // Snapshots are recorded at trade time; append a trailing point at the live
  // total so the chart's latest value matches the net-worth summary above it.
  // (Timed just after the last snapshot to keep timestamps strictly ascending.)
  const chartPoints =
    account && points.length > 0
      ? [
          ...points,
          {
            time: points[points.length - 1].time + 1,
            valueUsd: account.totalValueUsd,
          },
        ]
      : points;

  // Auth still initializing, or signed in but account data not loaded yet.
  if (!ready || (authenticated && accountLoading && !account)) {
    return <ProfileSkeleton />;
  }

  if (!authenticated) {
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarUploader />
          <div>
            <EditableUsername />
            <p className="text-sm text-muted">Paper trading account</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <DepositButton />
          <WithdrawButton />
          <ConvertButton />
        </div>
      </div>

      {/* Net worth */}
      <div className="mb-6 rounded-xl border border-line bg-panel p-5">
        <div className="mb-1 text-sm text-muted">Net worth</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {formatUsd(account?.totalValueUsd ?? 0)}
            </span>
            {account && (
              <span className="text-sm">
                <PriceChange value={account.change24hPercent} />{" "}
                <span className="text-muted">24h</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <AssetIcon asset="SOL" className="size-3.5" />
              <span className="font-medium text-foreground">
                {(account?.solBalance ?? 0).toLocaleString("en-US", {
                  maximumFractionDigits: 4,
                })}{" "}
                SOL
              </span>
              <span>
                (
                {formatUsd(
                  (account?.solBalance ?? 0) * (account?.solPriceUsd ?? 0),
                )}
                )
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <AssetIcon asset="USDC" className="size-3.5" />
              <span className="font-medium text-foreground">
                {(account?.usdcBalance ?? 0).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}{" "}
                USDC
              </span>
            </span>
          </div>
        </div>
        <div className="mt-4 h-56">
          <NetworthChart points={chartPoints} />
        </div>
      </div>

      {/* Holdings + Activity side by side (each sizes to its own content) */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Section title="Holdings">
          <PositionsList positions={positions} />
        </Section>
        <Section title="Activity">
          <ActivityHistory />
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-4 py-3 text-sm font-bold">
        {title}
      </div>
      {children}
    </div>
  );
}
