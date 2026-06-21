import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conditional logic, de-duping conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compact USD market-cap / volume style: $1.3M, $614.5K, $58.9M.
 */
export function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

/** Plain USD with 2 decimals: $18,632.33. */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Token price formatting that keeps significant digits for tiny memecoin prices.
 * e.g. 0.00139, 0.000320, 0.0111. Falls back to fixed notation for readability.
 */
export function formatTokenPrice(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "$0.00";
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  // Show up to 6 significant digits for sub-cent prices.
  return `$${value.toPrecision(3).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")}`;
}

/**
 * USD value for chart axes / crosshair. Groups thousands (1,000), compacts
 * millions+ (1.30M, 42.5B, 1.2T), and keeps significant digits for sub-$1
 * memecoin prices (0.00139).
 */
export function formatChartUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (abs === 0) return "$0";
  return `$${value.toLocaleString("en-US", { maximumSignificantDigits: 4 })}`;
}

/** Signed percentage: +442.81%, -25.42%. */
export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "0.00%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** Shorten a Solana address: 4vpf4q...N5pump. */
export function shortenAddress(address: string, lead = 6, tail = 4): string {
  if (!address) return "";
  if (address.length <= lead + tail) return address;
  return `${address.slice(0, lead)}...${address.slice(-tail)}`;
}

/** Relative "time ago" for trade feeds: 3s, 12m, 2h, 4d. */
export function timeAgo(timestamp: number | Date): string {
  const ms = typeof timestamp === "number" ? timestamp : timestamp.getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
