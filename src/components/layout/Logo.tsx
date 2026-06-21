import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark. Lowercase, tight — trading-app vibe. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "text-xl font-extrabold tracking-tight text-foreground",
        className,
      )}
    >
      chad<span className="text-brand">wallet</span>
    </Link>
  );
}
