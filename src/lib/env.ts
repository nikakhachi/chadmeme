/**
 * Centralized, type-safe environment configuration.
 *
 * Why this exists:
 * - One place to see every external service the app talks to.
 * - Keys are OPTIONAL by design. When a key is missing, the related data
 *   source falls back to mock data (see `src/lib/birdeye`, `src/lib/supabase`).
 *   This lets the whole app boot and be demoed before every account is wired up.
 * - Use the `has*` booleans to branch between real and mock behavior.
 *
 * Server-only secrets must NEVER be prefixed with NEXT_PUBLIC_ and must only be
 * imported from server code (route handlers, server components, server actions).
 */

/** Server-side secrets. Only safe to read in server contexts. */
export const serverEnv = {
  birdeyeApiKey: process.env.BIRDEYE_API_KEY ?? "",
  /** Full Solana mainnet RPC URL from Alchemy (or any provider). */
  solanaRpcUrl: process.env.SOLANA_RPC_URL ?? "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  /** Privy app secret, used to verify access tokens on the server. */
  privyAppSecret: process.env.PRIVY_APP_SECRET ?? "",
  /** Cloudflare R2 (S3-compatible) object storage for uploads (avatars). */
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2Bucket: process.env.R2_BUCKET ?? "",
  /** Public base URL the bucket serves from (e.g. https://pub-xxx.r2.dev). */
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
} as const;

/** Values safe to expose to the browser. Must be NEXT_PUBLIC_ prefixed. */
export const publicEnv = {
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublicKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

/** Feature/availability flags derived from which keys are present. */
export const features = {
  hasBirdeye: Boolean(serverEnv.birdeyeApiKey),
  hasSolanaRpc: Boolean(serverEnv.solanaRpcUrl),
  hasSupabase: Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublicKey),
  hasPrivy: Boolean(publicEnv.privyAppId),
  hasStorage: Boolean(
    serverEnv.r2AccountId &&
      serverEnv.r2AccessKeyId &&
      serverEnv.r2SecretAccessKey &&
      serverEnv.r2Bucket &&
      serverEnv.r2PublicUrl,
  ),
} as const;
