import { redirect } from "next/navigation";
import { getTrendingTokens } from "@/lib/birdeye";

/**
 * Home redirects to the top trending token's detail view, mirroring fomo's
 * "always land on a live token" experience.
 */
export default async function HomePage() {
  const tokens = await getTrendingTokens(1);
  const first = tokens[0];
  if (first) redirect(`/token/${first.address}`);
  // Fallback if no tokens are available (should not happen with mocks).
  return (
    <div className="grid h-full place-items-center text-muted">
      No tokens available.
    </div>
  );
}
