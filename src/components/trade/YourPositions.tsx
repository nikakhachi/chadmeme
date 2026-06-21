"use client";
import { useAuth } from "@/components/auth/auth-context";
import { useAccount } from "@/hooks/use-account";
import { PositionsList } from "@/components/profile/PositionsList";

/**
 * "Your Positions" card for the token detail right rail. Lists the signed-in
 * user's holdings (live value + PnL); each row links to that token's chart.
 * Hidden when logged out — positions are a per-user concept.
 */
export function YourPositions() {
  const { authenticated } = useAuth();
  const { positions } = useAccount(authenticated);

  if (!authenticated) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-4 py-3 text-sm font-bold">
        Your Positions
      </div>
      <PositionsList positions={positions} />
    </div>
  );
}
