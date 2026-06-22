import { redirect } from "next/navigation";
import { getTrendingTokens } from "@/lib/birdeye";

/**
 * "Enter the app" route for signed-in users: resolves the top trending token
 * and redirects to its detail view — the app's default trading screen.
 *
 * Trending can transiently fail (e.g. a BirdEye rate-limit) even when the list
 * loads fine elsewhere, so we retry a few times before giving up. We request the
 * same limit the sidebar uses so this shares Next's fetch cache with the
 * trending list (a recently-loaded list makes this an instant cache hit). If
 * market data is genuinely unavailable we render a graceful empty state inside
 * the app shell rather than leaving the user hanging.
 */
export default async function TokenIndexPage() {
  for (let attempt = 0; attempt < 4; attempt++) {
    const tokens = await getTrendingTokens(20);
    // redirect() throws to perform the redirect — keep it out of any try/catch.
    if (tokens[0]) redirect(`/token/${tokens[0].address}`);
    if (attempt < 3) await new Promise((r) => setTimeout(r, 600));
  }
  return (
    <div className="grid h-full place-items-center text-muted">
      No tokens available.
    </div>
  );
}
