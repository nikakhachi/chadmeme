import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { ProductShowcase } from "./ProductShowcase";
import { FeatureGrid } from "./FeatureGrid";
import { RewardsBand } from "./RewardsBand";
import { AppMarquee } from "./AppMarquee";
import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";

/**
 * Marketing landing page shown to signed-out visitors. Structure mirrors
 * fomo.family (hero → product → features → app gallery → final CTA → footer),
 * reskinned to ChadWallet's brand. Sits outside the (app) route group, so it
 * renders full-bleed without the trading shell.
 */
export function Landing() {
  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <ProductShowcase />
        <FeatureGrid />
        <RewardsBand />
        <AppMarquee />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
