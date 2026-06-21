import { cn } from "@/lib/utils";

/**
 * Token logo with a deterministic colored fallback when no image is available
 * (common for fresh memecoins). The fallback uses the first letters of the
 * symbol over a hue derived from the symbol so it's stable per token.
 */
const SIZES = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-12 text-base" };

export function TokenAvatar({
  symbol,
  logoURI,
  size = "md",
  className,
}: {
  symbol: string;
  logoURI?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const hue = hueFromString(symbol);
  if (logoURI) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote token logos
      <img
        src={logoURI}
        alt={symbol}
        className={cn("rounded-full object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white/90",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: `hsl(${hue} 55% 35%)` }}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

function hueFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (value.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  return Math.abs(hash) % 360;
}
