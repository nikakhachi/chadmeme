"use client";
import { useAuth } from "@/components/auth/auth-context";
import { DepositButton } from "@/components/profile/DepositButton";

/** Deposit button for the top bar — shown only when signed in. */
export function NavDeposit() {
  const { authenticated } = useAuth();
  if (!authenticated) return null;
  return <DepositButton variant="primary" size="sm" />;
}
