"use client";
import { useHolders } from "@/hooks/use-token-data";
import { formatCompactUsd, shortenAddress } from "@/lib/utils";

/** Top holders for a token with their share of supply. */
export function HoldersTable({ address }: { address: string }) {
  const { holders, isLoading } = useHolders(address);

  if (isLoading && holders.length === 0) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-elevated" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-line">
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Holder</th>
            <th className="px-3 py-2 text-right font-medium">Share</th>
            <th className="px-3 py-2 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((h, i) => (
            <tr key={h.ownerAddress} className="border-b border-line/50">
              <td className="px-3 py-2 text-muted">{i + 1}</td>
              <td className="px-3 py-2 font-mono text-xs">{shortenAddress(h.ownerAddress)}</td>
              <td className="px-3 py-2 text-right">{h.percentage.toFixed(2)}%</td>
              <td className="px-3 py-2 text-right">{formatCompactUsd(h.valueUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
