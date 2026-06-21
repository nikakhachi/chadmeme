import "server-only";
import bs58 from "bs58";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { serverEnv, features } from "@/lib/env";
import { getConnection } from "./connection";

/** SOL the relayer sends to cover the network fee + account rent for one action. */
export const GAS_BUFFER_SOL = 0.01;

let relayer: Keypair | null = null;

function getRelayer(): Keypair {
  if (!relayer) {
    relayer = Keypair.fromSecretKey(bs58.decode(serverEnv.relayerSecretKey));
  }
  return relayer;
}

/**
 * Sponsor gas for the user's next transaction: the relayer sends a fixed SOL
 * buffer to the user's wallet so the fee (and any account rent) is paid out of
 * relayer-funded SOL, never the user's own balance. Sent before EVERY action —
 * trade, conversion, or withdrawal, whether paid in USDC or SOL — since the user
 * already holds whatever they're spending and only needs gas added on top. The
 * result: the user pays exactly 0 in fees. No-op if the relayer isn't configured.
 */
export async function fundGas(userWallet: string): Promise<boolean> {
  if (!features.hasRelayer) return false;

  const conn = getConnection();
  const payer = getRelayer();
  const lamports = Math.round(GAS_BUFFER_SOL * LAMPORTS_PER_SOL);

  const { blockhash } = await conn.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: new PublicKey(userWallet),
        lamports,
      }),
    ],
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  tx.sign([payer]);
  const signature = await conn.sendRawTransaction(tx.serialize(), { maxRetries: 3 });

  // Wait for confirmation so the SOL is spendable before the user's tx.
  for (let i = 0; i < 30; i++) {
    const { value } = await conn.getSignatureStatus(signature);
    if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
      return true;
    }
    if (value?.err) throw new Error("Gas funding failed on-chain");
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Gas funding confirmation timed out");
}
