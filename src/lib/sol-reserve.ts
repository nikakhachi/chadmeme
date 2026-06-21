/**
 * Client-safe SOL reserves for "max" amounts. The relayer sponsors network fees,
 * but a SOL-input swap must keep enough SOL to front the temporary wSOL wrap-rent
 * (~0.002 SOL, refunded to the user on close) so it can execute. Keeping it as the
 * user's own reserve means the relayer funds ~0 and no SOL leaks into the wallet.
 */
export const SOL_WRAP_RESERVE = 0.005;

/**
 * A plain SOL withdrawal never wraps SOL — the relayer funds the fee — so only a
 * small safety margin is held back (covers a max withdraw if the relayer is down).
 */
export const SOL_WITHDRAW_RESERVE = 0.001;
