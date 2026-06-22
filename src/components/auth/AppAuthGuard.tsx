"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { LandingSplash } from "@/components/landing/LandingSplash";

/**
 * Gates the authenticated app shell: only signed-in users may view any route in
 * the (app) group (token pages, profile). Signed-out visitors are redirected to
 * the landing page at `/`.
 *
 * Auth state lives in the browser, so this guard is client-side. We render the
 * brand splash (never the protected content) until we know the user is
 * authenticated — both while auth is still resolving and while a signed-out
 * visitor is being bounced to `/` — so protected UI never flashes.
 */
export function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) router.replace("/");
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return <LandingSplash />;
  return <>{children}</>;
}
