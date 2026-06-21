"use client";
import { useState } from "react";
import { PriceChart } from "./PriceChart";
import { useOHLCV } from "@/hooks/use-token-data";
import { cn } from "@/lib/utils";
import type { ChartInterval } from "@/types/market";

const INTERVALS: ChartInterval[] = ["1m", "5m", "15m", "1H", "4H", "1D"];

/** Chart with interval selector and live OHLCV polling. */
export function ChartPanel({ address }: { address: string }) {
  const [interval, setInterval] = useState<ChartInterval>("1m");
  const { candles, isLoading } = useOHLCV(address, interval);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-line px-3 py-2">
        {INTERVALS.map((iv) => (
          <button
            key={iv}
            onClick={() => setInterval(iv)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              iv === interval
                ? "bg-elevated text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {iv}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">
        {isLoading && candles.length === 0 && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            Loading chart…
          </div>
        )}
        <PriceChart candles={candles} />
      </div>
    </div>
  );
}
