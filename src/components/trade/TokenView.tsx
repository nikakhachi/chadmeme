import { TokenHeader } from "./TokenHeader";
import { ChartPanel } from "@/components/chart/ChartPanel";
import { ActivityTabs } from "./ActivityTabs";
import { TradePanel } from "./TradePanel";
import { AboutToken } from "./AboutToken";
import { YourPositions } from "./YourPositions";
import type { TokenDetail } from "@/types/market";

/**
 * The full token experience: header + chart + activity (center) and the trade
 * panel + about card (right rail). Stacks vertically on small screens.
 */
export function TokenView({ token }: { token: TokenDetail }) {
  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      {/* Center: header, chart, activity */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TokenHeader token={token} />
        <div className="h-[570px] shrink-0">
          <ChartPanel
            address={token.address}
            supply={token.supply ?? (token.priceUsd > 0 ? token.marketCap / token.priceUsd : 0)}
          />
        </div>
        <ActivityTabs address={token.address} supply={token.supply} />
      </div>

      {/* Right rail: trade + about */}
      <div className="w-full shrink-0 space-y-3 border-line p-3 lg:w-[340px] lg:border-l">
        <TradePanel token={token} />
        <AboutToken token={token} />
        <YourPositions />
      </div>
    </div>
  );
}
