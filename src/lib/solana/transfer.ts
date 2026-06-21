import "server-only";
import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { getConnection, MINTS } from "./connection";
import { toBaseUnits } from "./jupiter";

const ASSET_DECIMALS = { SOL: 9, USDC: 6 } as const;

/**
 * Build an unsigned withdrawal (transfer) transaction. SOL uses a system
 * transfer; USDC uses an SPL transfer (creating the recipient's token account
 * if needed). The client signs it; the server broadcasts.
 */
export async function buildTransferTransaction(params: {
  owner: string;
  asset: "SOL" | "USDC";
  amount: number;
  destination: string;
}): Promise<string> {
  const conn = getConnection();
  const owner = new PublicKey(params.owner);
  const destination = new PublicKey(params.destination);
  const instructions = [];

  if (params.asset === "SOL") {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: destination,
        lamports: BigInt(toBaseUnits(params.amount, ASSET_DECIMALS.SOL)),
      }),
    );
  } else {
    const mint = new PublicKey(MINTS.USDC);
    const sourceAta = await getAssociatedTokenAddress(mint, owner);
    const destAta = await getAssociatedTokenAddress(mint, destination);
    // Create the recipient's USDC account if it doesn't exist yet.
    if (!(await conn.getAccountInfo(destAta))) {
      instructions.push(
        createAssociatedTokenAccountInstruction(owner, destAta, destination, mint),
      );
    }
    instructions.push(
      createTransferInstruction(
        sourceAta,
        destAta,
        owner,
        BigInt(toBaseUnits(params.amount, ASSET_DECIMALS.USDC)),
      ),
    );
  }

  const { blockhash } = await conn.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: owner,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  return Buffer.from(new VersionedTransaction(message).serialize()).toString("base64");
}
