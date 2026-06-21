import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils";

/** Renders a percentage in green (up) / red (down) with a sign. */
export function PriceChange({
  value,
  className,
  digits = 2,
}: {
  value: number;
  className?: string;
  digits?: number;
}) {
  const isUp = value >= 0;
  return (
    <span className={cn(isUp ? "text-up" : "text-down", className)}>
      {formatPercent(value, digits)}
    </span>
  );
}
