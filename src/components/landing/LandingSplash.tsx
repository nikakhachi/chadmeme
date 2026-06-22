/* eslint-disable @next/next/no-img-element -- static brand asset */

/**
 * Full-screen brand splash shown while auth resolves or an authenticated user
 * is being routed into the app. Kept dependency-free and instant so there's no
 * blank flash between the landing decision and the trading view.
 */
export function LandingSplash() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <img
        src="/assets/logo/dark.png"
        alt="ChadWallet"
        className="lp-float size-20 rounded-2xl"
      />
    </div>
  );
}
