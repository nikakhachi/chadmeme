import "server-only";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { features } from "@/lib/env";
import { getConnection, MINTS } from "./connection";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

/** A token balance held by a wallet (UI amount, scaled by decimals). */
export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
}

/** Native SOL balance of a wallet, in SOL. */
export async function getSolBalance(owner: string): Promise<number> {
  if (!features.hasSolanaRpc) return 0;
  try {
    const lamports = await getConnection().getBalance(new PublicKey(owner));
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

/**
 * All SPL token balances of a wallet (both Token and Token-2022 programs),
 * excluding zero balances. Wrapped SOL is reported under the SOL mint.
 */
export async function getTokenBalances(owner: string): Promise<TokenBalance[]> {
  if (!features.hasSolanaRpc) return [];
  try {
    const ownerKey = new PublicKey(owner);
    const conn = getConnection();
    const [legacy, token2022] = await Promise.all([
      conn.getParsedTokenAccountsByOwner(ownerKey, { programId: TOKEN_PROGRAM_ID }),
      conn
        .getParsedTokenAccountsByOwner(ownerKey, { programId: TOKEN_2022_PROGRAM_ID })
        .catch(() => ({ value: [] as never[] })),
    ]);

    // A wallet can hold multiple token accounts for the same mint — aggregate.
    const byMint = new Map<string, TokenBalance>();
    for (const { account } of [...legacy.value, ...token2022.value]) {
      const info = account.data.parsed.info as {
        mint: string;
        tokenAmount: { uiAmount: number | null; decimals: number };
      };
      const amount = info.tokenAmount.uiAmount ?? 0;
      if (amount <= 0) continue;
      const existing = byMint.get(info.mint);
      if (existing) existing.amount += amount;
      else byMint.set(info.mint, { mint: info.mint, amount, decimals: info.tokenAmount.decimals });
    }
    return [...byMint.values()];
  } catch {
    return [];
  }
}

/** Convenience: the wallet's USDC balance (UI amount). */
export async function getUsdcBalance(owner: string): Promise<number> {
  const balances = await getTokenBalances(owner);
  return balances.find((b) => b.mint === MINTS.USDC)?.amount ?? 0;
}
