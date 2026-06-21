import "server-only";
import bs58 from "bs58";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { serverEnv, features } from "@/lib/env";
import { getConnection } from "./connection";
import { getSolBalance } from "./balances";

/** Tiny safety margin added on top of the precise requirement (0.00001 SOL). */
const DUST_LAMPORTS = 10_000;
/** Fee fallback when getFeeForMessage can't be read (RPC hiccup): ~0.0002 SOL. */
const FEE_FALLBACK_LAMPORTS = 200_000;

let relayer: Keypair | null = null;

function getRelayer(): Keypair {
  if (!relayer) {
    relayer = Keypair.fromSecretKey(bs58.decode(serverEnv.relayerSecretKey));
  }
  return relayer;
}

/** Rent-exempt minimum for an SPL token account (165 bytes). Cached per process. */
let rentLamports: number | null = null;
async function tokenAccountRentLamports(): Promise<number> {
  if (rentLamports == null) {
    rentLamports = await getConnection().getMinimumBalanceForRentExemption(165);
  }
  return rentLamports;
}

/** Exact network fee (base + encoded priority fee) for an already-built tx. */
async function estimateTxFeeLamports(txBase64: string): Promise<number> {
  const conn = getConnection();
  const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
  const { value } = await conn.getFeeForMessage(tx.message);
  return value ?? FEE_FALLBACK_LAMPORTS;
}

/** Whether `owner` has no associated token account yet for `mint`. */
export async function userMissingAta(owner: string, mint: string): Promise<boolean> {
  const ata = await getAssociatedTokenAddress(new PublicKey(mint), new PublicKey(owner));
  return !(await getConnection().getAccountInfo(ata));
}

/**
 * Ensure the user's wallet holds at least `requiredLamports`, sending the
 * shortfall (plus dust) from the relayer. The required amount already accounts
 * for the SOL the user intends to spend, so this naturally funds nothing when
 * the user has enough. Awaits confirmation so the SOL is spendable before the
 * user's transaction. No-op if the relayer isn't configured.
 */
async function topUpGasIfNeeded(userWallet: string, requiredLamports: number): Promise<boolean> {
  if (!features.hasRelayer) return false;
  const balance = Math.round((await getSolBalance(userWallet)) * 1e9);
  if (balance >= requiredLamports) return false;

  const conn = getConnection();
  const payer = getRelayer();
  const lamports = requiredLamports - balance + DUST_LAMPORTS;

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

/**
 * Sponsor gas for a built transaction so the user pays 0 in fees. Funds exactly
 * what the tx needs beyond the user's balance:
 *   required = spendLamports + fee + (wrapsSol + newAtaCount) * tokenAccountRent
 * where `spendLamports` is the SOL the user is intentionally spending (0 for a
 * USDC-funded action). `wrapsSol` covers the temporary wSOL account Jupiter uses
 * when SOL is on either side of a swap (its rent refunds to the user on close,
 * but must be available during execution); `newAtaCount` covers token accounts
 * the tx opens and keeps. No-op if the relayer isn't configured.
 */
export async function sponsorGasForTx(
  userWallet: string,
  opts: { txBase64: string; spendLamports?: number; wrapsSol?: boolean; newAtaCount?: number },
): Promise<boolean> {
  if (!features.hasRelayer) return false;
  const { txBase64, spendLamports = 0, wrapsSol = false, newAtaCount = 0 } = opts;

  const fee = await estimateTxFeeLamports(txBase64);
  const accounts = (wrapsSol ? 1 : 0) + newAtaCount;
  const rent = accounts > 0 ? accounts * (await tokenAccountRentLamports()) : 0;
  const required = spendLamports + fee + rent;

  return topUpGasIfNeeded(userWallet, required);
}
