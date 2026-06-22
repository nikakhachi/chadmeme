"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { Landing } from "./Landing";
import { LandingSplash } from "./LandingSplash";

/**
 * Decides what `/` shows:
 *   • signed out  → the marketing landing page
 *   • signed in   → into the trading app, via the `/token` entry route
 *
 * The `/token` route resolves the top trending token server-side (with retries
 * and a graceful empty state), so we deliberately do NOT block here on a client
 * data fetch — if market data is unavailable the signed-in user still lands in
 * the app shell instead of an endless splash. While auth resolves, or while an
 * authed user is being routed onward, we show a minimal brand splash so the
 * landing never flashes for someone who's logged in.
 */
export function HomeGate() {
  const { ready, authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.replace("/token");
  }, [ready, authenticated, router]);

  if (!ready || authenticated) return <LandingSplash />;
  return <Landing />;
}
