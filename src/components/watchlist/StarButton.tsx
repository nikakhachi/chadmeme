"use client";
import { Star } from "lucide-react";
import { useWatchlist } from "./watchlist-context";
import { cn } from "@/lib/utils";

/** Toggle a token's watchlist membership. `alwaysVisible` keeps it shown when
 *  not starred (header); otherwise it reveals on row hover (list). */
export function StarButton({
  address,
  size = 14,
  alwaysVisible = false,
  className,
}: {
  address: string;
  size?: number;
  alwaysVisible?: boolean;
  className?: string;
}) {
  const { isStarred, toggle } = useWatchlist();
  const starred = isStarred(address);

  return (
    <button
      type="button"
      aria-label={starred ? "Remove from watchlist" : "Add to watchlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(address);
      }}
      className={cn(
        "shrink-0 p-0.5 transition-colors",
        starred
          ? "text-yellow-400"
          : cn(
              "text-subtle hover:text-foreground",
              !alwaysVisible && "opacity-0 group-hover:opacity-100",
            ),
        className,
      )}
    >
      <Star size={size} fill={starred ? "currentColor" : "none"} />
    </button>
  );
}
