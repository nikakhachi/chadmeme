import { redirect } from "next/navigation";
import { getTrendingTokens } from "@/lib/birdeye";

/**
 * Home redirects to the top trending token's detail view, mirroring fomo's
 * "always land on a live token" experience.
 *
 * Trending can transiently fail (e.g. a BirdEye rate-limit) even when the list
 * loads fine elsewhere, so we retry a few times before giving up — landing on a
 * live token should be reliable. We request the same limit the sidebar uses so
 * this shares Next's fetch cache with the trending list (a recently-loaded list
 * makes this an instant cache hit).
 */
export default async function HomePage() {
  for (let attempt = 0; attempt < 4; attempt++) {
    const tokens = await getTrendingTokens(20);
    // redirect() throws to perform the redirect — keep it out of any try/catch.
    if (tokens[0]) redirect(`/token/${tokens[0].address}`);
    if (attempt < 3) await new Promise((r) => setTimeout(r, 600));
  }
  // Only reached if trending genuinely can't be fetched (missing key / outage).
  return (
    <div className="grid h-full place-items-center text-muted">
      No tokens available.
    </div>
  );
}
