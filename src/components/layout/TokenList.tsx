"use client";
import { usePathname } from "next/navigation";
import { TokenListItem } from "@/components/tokens/TokenListItem";
import type { Token } from "@/types/market";

/** Client list that highlights the token matching the current route. */
export function TokenList({ tokens }: { tokens: Token[] }) {
  const pathname = usePathname();
  const activeAddress = pathname.startsWith("/token/")
    ? decodeURIComponent(pathname.split("/token/")[1] ?? "")
    : undefined;

  return (
    <>
      {tokens.map((token) => (
        <TokenListItem
          key={token.address}
          token={token}
          active={token.address === activeAddress}
        />
      ))}
    </>
  );
}
