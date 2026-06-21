import "server-only";
import { getConnection } from "./connection";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Broadcast a client-signed transaction (base64) and wait for confirmation.
 * Returns the signature. Throws if the tx fails on-chain or times out.
 */
export async function broadcastAndConfirm(signedTxBase64: string): Promise<string> {
  const conn = getConnection();
  const raw = Buffer.from(signedTxBase64, "base64");
  const signature = await conn.sendRawTransaction(raw, { maxRetries: 3 });

  // Poll the signature status until confirmed (~30s budget).
  for (let i = 0; i < 30; i++) {
    const { value } = await conn.getSignatureStatus(signature);
    if (value?.err) throw new Error("Transaction failed on-chain");
    if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
      return signature;
    }
    await sleep(1000);
  }
  throw new Error("Transaction confirmation timed out");
}
