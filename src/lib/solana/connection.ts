import "server-only";
import { Connection } from "@solana/web3.js";
import { serverEnv } from "@/lib/env";

/** Well-known Solana mints used across the app. */
export const MINTS = {
  SOL: "So11111111111111111111111111111111111111112", // wrapped SOL
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
} as const;

/** Shared Solana RPC connection (Alchemy). Server-only. */
let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(serverEnv.solanaRpcUrl, "confirmed");
  }
  return connection;
}
