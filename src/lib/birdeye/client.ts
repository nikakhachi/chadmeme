import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Low-level BirdEye HTTP client. Server-only (holds the API key).
 *
 * Docs: https://docs.birdeye.so/reference
 * Base: https://public-api.birdeye.so  ·  Auth: `X-API-KEY` header
 * Chain is pinned to Solana via the `x-chain` header.
 */
const BASE_URL = "https://public-api.birdeye.so";

export interface BirdeyeRequestOptions {
  /** Query string params. Undefined/null values are dropped. */
  params?: Record<string, string | number | undefined | null>;
  /** ISR revalidate window in seconds (Next.js fetch cache). */
  revalidateSeconds?: number;
}

/** Thrown when BirdEye returns a non-2xx response. Callers fall back to mocks. */
export class BirdeyeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BirdeyeError";
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * BirdEye's free tier rate-limits aggressively, and a token page fires several
 * data requests at once. We serialize requests with a small minimum spacing so
 * bursts don't trip the limit. Combined with Next's fetch cache (revalidate),
 * repeated reads are served from cache and don't hit the network at all.
 */
const MIN_SPACING_MS = 300;
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

function acquireSlot(): Promise<void> {
  const slot = queue.then(async () => {
    const wait = MIN_SPACING_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await delay(wait);
    lastRequestAt = Date.now();
  });
  // Keep the chain alive even if a turn rejects.
  queue = slot.catch(() => {});
  return slot;
}

/** True if a response indicates we were rate-limited (HTTP 429 or body flag). */
function isRateLimited(status: number, body: { message?: string }): boolean {
  return status === 429 || /too many requests/i.test(body.message ?? "");
}

export async function birdeyeGet<T>(
  path: string,
  { params, revalidateSeconds = 30 }: BirdeyeRequestOptions = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  // Up to 2 attempts: the second covers a transient rate-limit hiccup.
  for (let attempt = 0; attempt < 2; attempt++) {
    await acquireSlot();
    const res = await fetch(url, {
      headers: {
        "X-API-KEY": serverEnv.birdeyeApiKey,
        "x-chain": "solana",
        accept: "application/json",
      },
      next: { revalidate: revalidateSeconds },
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: T;
    };

    if (isRateLimited(res.status, json)) {
      if (attempt === 0) {
        await delay(800);
        continue;
      }
      throw new BirdeyeError(`BirdEye ${path} rate limited`, 429);
    }
    if (!res.ok || json.success === false || json.data === undefined) {
      throw new BirdeyeError(`BirdEye ${path} returned no data`, res.status);
    }
    return json.data;
  }

  throw new BirdeyeError(`BirdEye ${path} failed`, 429);
}
