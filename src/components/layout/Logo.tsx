import Link from "next/link";
import { cn } from "@/lib/utils";

/** Brand mark: logo image + wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small static brand asset */}
      <img src="/logo.png" alt="ChadWallet" className="size-7 shrink-0" />
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        Chad<span className="text-brand">Wallet</span>
      </span>
    </Link>
  );
}
