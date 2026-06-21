"use client";
import { useState } from "react";
import { TradesFeed } from "./TradesFeed";
import { HoldersTable } from "./HoldersTable";
import { cn } from "@/lib/utils";

type Tab = "swaps" | "holders";

/** Tabbed panel under the chart: live swaps and holders. */
export function ActivityTabs({ address, supply }: { address: string; supply?: number }) {
  const [tab, setTab] = useState<Tab>("swaps");

  return (
    <div className="flex flex-col">
      <div className="flex gap-4 border-b border-line px-3">
        {(["swaps", "holders"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 py-2.5 text-sm font-semibold capitalize transition-colors",
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "swaps" ? (
        <TradesFeed address={address} supply={supply} />
      ) : (
        <HoldersTable address={address} />
      )}
    </div>
  );
}
