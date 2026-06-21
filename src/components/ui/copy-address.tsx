"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { shortenAddress } from "@/lib/utils";

/** Shortened address with a click-to-copy affordance. */
export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 font-mono hover:text-foreground"
    >
      {shortenAddress(address)}
      {copied ? <Check className="size-3 text-up" /> : <Copy className="size-3" />}
    </button>
  );
}
