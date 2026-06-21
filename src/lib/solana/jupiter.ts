import "server-only";

/**
 * Jupiter swap aggregator (free "lite" API). The server fetches a quote and
 * builds an unsigned swap transaction; the client signs it with the Privy
 * embedded wallet and broadcasts. Docs: https://dev.jup.ag/docs/swap-api
 */
const JUP_BASE = "https://lite-api.jup.ag/swap/v1";

/** Raw Jupiter quote (opaque — passed back into the swap call verbatim). */
export type JupiterQuote = Record<string, unknown> & {
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  slippageBps: number;
};

/** Convert a UI amount to integer base units (string) without float drift. */
export function toBaseUnits(amount: number, decimals: number): string {
  if (!(amount > 0)) return "0";
  const [int, frac = ""] = amount.toFixed(decimals).split(".");
  const combined = `${int}${frac.padEnd(decimals, "0").slice(0, decimals)}`;
  return BigInt(combined).toString();
}

/** Convert integer base units (string) back to a UI amount. */
export function fromBaseUnits(base: string, decimals: number): number {
  return Number(base) / 10 ** decimals;
}

/** Fetch a swap quote for `amount` (base units) of inputMint → outputMint. */
export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string; // base units
  slippageBps?: number;
}): Promise<JupiterQuote> {
  const url = new URL(`${JUP_BASE}/quote`);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", params.amount);
  // Let Jupiter pick slippage dynamically unless told otherwise.
  if (params.slippageBps != null) {
    url.searchParams.set("slippageBps", String(params.slippageBps));
  } else {
    url.searchParams.set("dynamicSlippage", "true");
  }

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Jupiter quote failed (${res.status})`);
  return (await res.json()) as JupiterQuote;
}

/**
 * Build a base64 unsigned swap transaction for `quote`, payable by
 * `userPublicKey`. Uses dynamic slippage + compute units + auto priority fee
 * for reliability on volatile memecoin routes.
 */
export async function buildSwapTransaction(params: {
  quote: JupiterQuote;
  userPublicKey: string;
}): Promise<string> {
  const res = await fetch(`${JUP_BASE}/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quote,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: { maxLamports: 2_000_000, priorityLevel: "high" },
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jupiter swap build failed (${res.status})`);
  const json = (await res.json()) as { swapTransaction?: string };
  if (!json.swapTransaction) throw new Error("Jupiter returned no swap transaction");
  return json.swapTransaction;
}
