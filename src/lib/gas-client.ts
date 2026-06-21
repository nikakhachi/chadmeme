/**
 * Ask the server to fund this action's gas from the relayer, so the user pays 0
 * fees. Call before every trade/convert/withdraw. Best-effort: failures are
 * swallowed so a misconfigured relayer never blocks the action — the underlying
 * tx will surface any error.
 */
export async function ensureGas(userId: string, wallet: string): Promise<void> {
  try {
    await fetch("/api/gas/topup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-cw-user": userId },
      body: JSON.stringify({ wallet }),
    });
  } catch {
    // ignore
  }
}
