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
 * Send `lamports` of gas SOL from the relayer to the user, awaiting confirmation
 * so it's spendable before the user's transaction. Sent on EVERY action (never
 * conditioned on the user's balance) so network fees always come out of
 * relayer-funded SOL, not the user's own — the user pays exactly 0. No-op if the
 * relayer isn't configured or there's nothing to send.
 */
async function sendGasToUser(userWallet: string, lamports: number): Promise<boolean> {
  if (!features.hasRelayer || lamports <= 0) return false;

  const conn = getConnection();
  const payer = getRelayer();

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
 * Sponsor the exact gas a built transaction needs so the user pays 0 in fees.
 * The relayer always sends the user only the GAS — never the amount they're
 * spending (the user already holds that) — so the user can spend their full
 * balance and never dips into it for fees:
 *   gas = fee + (wrapsSol + newAtaCount) * tokenAccountRent + dust
 * `wrapsSol` covers the temporary wSOL account Jupiter uses when SOL is on either
 * side of a swap (its rent refunds to the user on close, but must be available
 * during execution); `newAtaCount` covers token accounts the tx opens and keeps.
 * No-op if the relayer isn't configured.
 */
export async function sponsorGasForTx(
  userWallet: string,
  opts: { txBase64: string; wrapsSol?: boolean; newAtaCount?: number },
): Promise<boolean> {
  if (!features.hasRelayer) return false;
  const { txBase64, wrapsSol = false, newAtaCount = 0 } = opts;

  const fee = await estimateTxFeeLamports(txBase64);
  const accounts = (wrapsSol ? 1 : 0) + newAtaCount;
  const rent = accounts > 0 ? accounts * (await tokenAccountRentLamports()) : 0;
  const gas = fee + rent + DUST_LAMPORTS;

  return sendGasToUser(userWallet, gas);
}
