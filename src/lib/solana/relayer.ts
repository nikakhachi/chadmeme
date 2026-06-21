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
import { getSolBalance } from "./balances";

/** Below this SOL balance, a user can't cover trade fees → top them up. */
const MIN_SOL = 0.003;
/** Top up to roughly this balance (covers several trades before topping again). */
const TARGET_SOL = 0.012;

let relayer: Keypair | null = null;

function getRelayer(): Keypair {
  if (!relayer) {
    relayer = Keypair.fromSecretKey(bs58.decode(serverEnv.relayerSecretKey));
  }
  return relayer;
}

/**
 * If the user's SOL is too low to pay network fees, the relayer wallet sends
 * them enough to reach TARGET_SOL. Returns whether a top-up was sent. No-op
 * when the relayer isn't configured or the user already has enough.
 */
export async function topUpGasIfNeeded(userWallet: string): Promise<boolean> {
  if (!features.hasRelayer) return false;
  const balance = await getSolBalance(userWallet);
  if (balance >= MIN_SOL) return false;

  const conn = getConnection();
  const payer = getRelayer();
  const lamports = Math.round((TARGET_SOL - balance) * LAMPORTS_PER_SOL);

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

  // Wait for confirmation so the SOL is spendable before the user's trade.
  for (let i = 0; i < 30; i++) {
    const { value } = await conn.getSignatureStatus(signature);
    if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
      return true;
    }
    if (value?.err) throw new Error("Gas top-up failed on-chain");
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Gas top-up confirmation timed out");
}
