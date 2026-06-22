import { HomeGate } from "@/components/landing/HomeGate";

/**
 * Root route. Renders the marketing landing page for signed-out visitors and
 * routes authenticated users straight into the trading app. The decision is
 * client-side (auth state lives in the browser), so this is a thin wrapper
 * around <HomeGate>. Note this lives OUTSIDE the (app) route group, so the
 * landing page renders full-bleed without the trading shell (top bar/sidebar).
 */
export default function HomePage() {
  return <HomeGate />;
}
