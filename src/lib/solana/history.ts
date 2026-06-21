import "server-only";
import { PublicKey } from "@solana/web3.js";
import { features } from "@/lib/env";
import type { TransferRecord } from "@/types/trading";
import { getConnection, MINTS } from "./connection";

/**
 * Detect recent SOL/USDC deposits into a wallet from on-chain history (RPC
 * only). A deposit = a confirmed tx where the wallet's SOL/USDC balance
 * increased and the wallet was NOT the fee payer (so swaps/withdrawals, which
 * the wallet initiates, are excluded). Defensive: returns [] on any error.
 */
export async function getDeposits(wallet: string, limit = 20): Promise<TransferRecord[]> {
  if (!features.hasSolanaRpc) return [];
  try {
    const conn = getConnection();
    const owner = new PublicKey(wallet);
    const sigs = await conn.getSignaturesForAddress(owner, { limit });
    if (sigs.length === 0) return [];

    const txs = await conn.getParsedTransactions(
      sigs.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0 },
    );

    const deposits: TransferRecord[] = [];
    txs.forEach((tx, i) => {
      const sig = sigs[i];
      if (!tx?.meta || tx.meta.err) return;

      const keys = tx.transaction.message.accountKeys;
      const idx = keys.findIndex((k) => k.pubkey.toBase58() === wallet);
      if (idx <= 0) return; // not found, or wallet is the fee payer (index 0)

      const createdAt = sig.blockTime
        ? new Date(sig.blockTime * 1000).toISOString()
        : new Date().toISOString();

      // SOL delta for the wallet.
      const solDelta = (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / 1e9;
      if (solDelta > 1e-6) {
        deposits.push({
          id: `${sig.signature}-sol`,
          kind: "deposit",
          asset: "SOL",
          amount: solDelta,
          txSignature: sig.signature,
          createdAt,
        });
      }

      // USDC delta for the wallet (from parsed token balances).
      const pre =
        tx.meta.preTokenBalances?.find((b) => b.owner === wallet && b.mint === MINTS.USDC)
          ?.uiTokenAmount.uiAmount ?? 0;
      const post =
        tx.meta.postTokenBalances?.find((b) => b.owner === wallet && b.mint === MINTS.USDC)
          ?.uiTokenAmount.uiAmount ?? 0;
      const usdcDelta = post - pre;
      if (usdcDelta > 1e-6) {
        deposits.push({
          id: `${sig.signature}-usdc`,
          kind: "deposit",
          asset: "USDC",
          amount: usdcDelta,
          txSignature: sig.signature,
          createdAt,
        });
      }
    });
    return deposits;
  } catch {
    return [];
  }
}
