import "server-only";
import { features } from "@/lib/env";

/**
 * Resolve the acting user id for an API request.
 *
 * The client sends its identity in the `x-cw-user` header (the auth user id).
 * In mock/demo mode this is trusted as-is. When Privy is configured, this is
 * where we'll verify the Privy access token instead.
 *
 * VERIFY: add Privy token verification (privy.verifyAuthToken) before treating
 * this as authenticated in production.
 */
export function getUserId(request: Request): string | null {
  const header = request.headers.get("x-cw-user");
  if (header && header.trim()) return header.trim();
  // In demo mode we tolerate an anonymous default so flows are exercisable.
  if (!features.hasPrivy) return "demo-user";
  return null;
}
