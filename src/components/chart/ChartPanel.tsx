"use client";
import { useMemo, useState } from "react";
import { CandlestickChart, LineChart } from "lucide-react";
import { PriceChart, type ChartType, type PriceMode, type TradeMarker } from "./PriceChart";
import { Spinner } from "@/components/ui/spinner";
import { useOHLCV } from "@/hooks/use-token-data";
import { useActivity } from "@/hooks/use-profile-data";
import { cn } from "@/lib/utils";
import type { ChartInterval } from "@/types/market";

const INTERVALS: ChartInterval[] = ["1m", "5m", "15m", "1H", "4H", "1D"];

/** Chart with interval, price/mcap, and candle/line controls + live OHLCV. */
export function ChartPanel({ address, supply }: { address: string; supply: number }) {
  const [interval, setInterval] = useState<ChartInterval>("1m");
  const [priceMode, setPriceMode] = useState<PriceMode>("price");
  const [chartType, setChartType] = useState<ChartType>("candles");
  const { candles, isLoading, isValidating, error } = useOHLCV(address, interval);

  // Mark the signed-in user's own buys/sells for this token on the chart.
  const { items } = useActivity();
  const markers = useMemo<TradeMarker[]>(
    () =>
      items
        .filter((i) => i.type === "trade" && i.tokenAddress === address)
        .map((i) => ({
          time: Math.floor(new Date(i.createdAt).getTime() / 1000),
          side: (i as { side: TradeMarker["side"] }).side,
        })),
    [items, address],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        {/* Interval */}
        <div className="flex items-center gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                iv === interval ? "bg-elevated text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {iv}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Price / MCap */}
          <Segmented
            options={[
              { value: "price", label: "Price" },
              { value: "mcap", label: "MCap" },
            ]}
            value={priceMode}
            onChange={(v) => setPriceMode(v as PriceMode)}
          />
          {/* Candles / Line */}
          <Segmented
            options={[
              { value: "candles", label: <CandlestickChart className="size-3.5" /> },
              { value: "line", label: <LineChart className="size-3.5" /> },
            ]}
            value={chartType}
            onChange={(v) => setChartType(v as ChartType)}
          />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {candles.length === 0 && (
          <div className="absolute inset-0 z-10 grid place-items-center">
            {/* Still fetching or retrying a failed/rate-limited request — keep
                the spinner so a transient failure isn't shown as "no data". */}
            {isLoading || isValidating || error ? (
              <Spinner className="size-7" />
            ) : (
              <span className="text-sm text-muted">No chart data available.</span>
            )}
          </div>
        )}
        <PriceChart
          candles={candles}
          chartType={chartType}
          priceMode={priceMode}
          supply={supply}
          markers={markers}
          resetKey={`${address}:${interval}`}
        />
      </div>
    </div>
  );
}

/** Small segmented control (pill group) used for the chart toggles. */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-canvas p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "grid h-6 place-items-center rounded-md px-2 text-xs font-medium transition-colors",
            value === o.value ? "bg-elevated text-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
