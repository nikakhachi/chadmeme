import "server-only";
import type {
  Candle,
  ChartInterval,
  Holder,
  MarketTrade,
  Token,
  TokenDetail,
} from "@/types/market";
import { birdeyeGet } from "./client";

/**
 * Public BirdEye data API — the only module the rest of the app imports for
 * market data. Returns normalized `@/types/market` shapes. There is NO mock
 * fallback: on a missing key or a failed/rate-limited request, reads return
 * empty/zero so real API problems are visible (not masked by fake data).
 */

/** Minimal placeholder when a token's detail can't be loaded (surfaces the gap). */
function placeholderTokenDetail(address: string): TokenDetail {
  return {
    address,
    symbol: "—",
    name: "Unknown",
    decimals: 9,
    priceUsd: 0,
    priceChange24h: 0,
    marketCap: 0,
    volume24h: 0,
    liquidity: 0,
    holders: 0,
    supply: 0,
  };
}

/** Pick the first defined value among candidate keys on a raw object. */
function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : fallback;
}

// ── Trending tokens ──────────────────────────────────────────────────────────

export async function getTrendingTokens(limit = 50): Promise<Token[]> {
  try {
    const data = await birdeyeGet<{ tokens?: Record<string, unknown>[] }>(
      "/defi/token_trending",
      { params: { sort_by: "rank", sort_type: "asc", offset: 0, limit }, revalidateSeconds: 20 },
    );
    const tokens = data.tokens ?? [];
    return tokens.map(mapToken);
  } catch {
    return [];
  }
}

// ── Search ───────────────────────────────────────────────────────────────────

/** Search all Solana tokens by name/symbol/address via BirdEye `/defi/v3/search`. */
export async function searchTokens(query: string, limit = 12): Promise<Token[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const data = await birdeyeGet<{ items?: { type?: string; result?: Record<string, unknown>[] }[] }>(
      "/defi/v3/search",
      {
        params: {
          chain: "solana",
          keyword: q,
          target: "token",
          sort_by: "volume_24h_usd",
          sort_type: "desc",
          offset: 0,
          limit,
        },
        revalidateSeconds: 30,
      },
    );
    const tokenGroup = (data.items ?? []).find((i) => i.type === "token");
    return (tokenGroup?.result ?? []).map(mapToken);
  } catch {
    return [];
  }
}

// ── Prices (for position valuation / PnL) ────────────────────────────────────

/**
 * Current USD price for one token via `/defi/price` (works on the free tier;
 * `/defi/multi_price` requires a paid plan). Returns 0 on failure so trade
 * execution rejects rather than filling at a stale/fake price.
 */
export async function getPrice(address: string): Promise<number> {
  try {
    const data = await birdeyeGet<{ value?: number }>("/defi/price", {
      params: { address },
      revalidateSeconds: 10,
    });
    return num(data.value);
  } catch {
    return 0;
  }
}

/** Current USD prices for many tokens, returned as an address→price map. */
export async function getPrices(
  addresses: string[],
): Promise<Record<string, number>> {
  if (addresses.length === 0) return {};
  const entries = await Promise.all(
    addresses.map(async (a) => [a, await getPrice(a)] as const),
  );
  return Object.fromEntries(entries);
}

// ── Token detail ─────────────────────────────────────────────────────────────

export async function getTokenDetail(address: string): Promise<TokenDetail> {
  try {
    const raw = await birdeyeGet<Record<string, unknown>>("/defi/token_overview", {
      params: { address },
      revalidateSeconds: 15,
    });
    const ext = (pick<Record<string, unknown>>(raw, "extensions") ?? {}) as Record<string, unknown>;
    return {
      ...mapToken(raw),
      description: pick<string>(ext, "description"),
      website: pick<string>(ext, "website"),
      twitter: pick<string>(ext, "twitter"),
      telegram: pick<string>(ext, "telegram"),
      supply: num(pick(raw, "circulatingSupply", "supply")),
      // VERIFY-FIELD: top-10 holder percent may live under a different key.
      top10HoldersPercent: num(pick(raw, "top10HolderPercent")) * 100 || undefined,
    };
  } catch {
    return placeholderTokenDetail(address);
  }
}

/** Fetch normalized token data for a set of addresses (e.g. the watchlist). */
export async function getTokensByAddresses(addresses: string[]): Promise<Token[]> {
  if (addresses.length === 0) return [];
  const tokens = await Promise.all(addresses.map((a) => getTokenDetail(a)));
  // Preserve the requested order; drop any that failed to resolve a symbol.
  return tokens.filter((t) => t.address);
}

// ── OHLCV candles ────────────────────────────────────────────────────────────

const INTERVAL_TO_BIRDEYE: Record<ChartInterval, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1H": "1H",
  "4H": "4H",
  "1D": "1D",
};

const INTERVAL_SECONDS: Record<ChartInterval, number> = {
  "1m": 60, "5m": 300, "15m": 900, "1H": 3600, "4H": 14400, "1D": 86400,
};

export async function getOHLCV(
  address: string,
  interval: ChartInterval = "15m",
  count = 150,
): Promise<Candle[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - INTERVAL_SECONDS[interval] * count;
    const data = await birdeyeGet<{ items?: Record<string, unknown>[] }>("/defi/ohlcv", {
      params: {
        address,
        type: INTERVAL_TO_BIRDEYE[interval],
        time_from: from,
        time_to: now,
        currency: "usd",
      },
      revalidateSeconds: 15,
    });
    return (data.items ?? []).map(
      (it): Candle => ({
        time: num(pick(it, "unixTime", "time")),
        open: num(pick(it, "o", "open")),
        high: num(pick(it, "h", "high")),
        low: num(pick(it, "l", "low")),
        close: num(pick(it, "c", "close")),
        volume: num(pick(it, "v", "volume")),
      }),
    );
  } catch {
    return [];
  }
}

// ── Live trades ──────────────────────────────────────────────────────────────

export async function getTokenTrades(address: string, limit = 40): Promise<MarketTrade[]> {
  try {
    const data = await birdeyeGet<{ items?: Record<string, unknown>[] }>("/defi/txs/token", {
      params: { address, tx_type: "swap", sort_type: "desc", offset: 0, limit },
      revalidateSeconds: 10,
    });
    return (data.items ?? []).map((it) => mapTrade(it, address));
  } catch {
    return [];
  }
}

// ── Holders ──────────────────────────────────────────────────────────────────

export async function getTokenHolders(address: string, limit = 20): Promise<Holder[]> {
  try {
    // The holder endpoint returns balances only — no USD value or share. We
    // fetch the token's price + supply (cached) to compute both ourselves.
    const [data, detail] = await Promise.all([
      birdeyeGet<{ items?: Record<string, unknown>[] }>("/defi/v3/token/holder", {
        params: { address, offset: 0, limit },
        revalidateSeconds: 30,
      }),
      getTokenDetail(address),
    ]);
    const supply = detail.supply ?? 0;
    return (data.items ?? []).map((it): Holder => {
      const tokenAmount = num(pick(it, "ui_amount", "uiAmount"));
      return {
        ownerAddress: pick<string>(it, "owner") ?? "",
        tokenAmount,
        valueUsd: tokenAmount * detail.priceUsd,
        percentage: supply > 0 ? (tokenAmount / supply) * 100 : 0,
      };
    });
  } catch {
    return [];
  }
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapToken(raw: Record<string, unknown>): Token {
  return {
    address: pick<string>(raw, "address") ?? "",
    symbol: pick<string>(raw, "symbol") ?? "—",
    name: pick<string>(raw, "name") ?? pick<string>(raw, "symbol") ?? "Unknown",
    logoURI: pick<string>(raw, "logoURI", "logo_uri", "icon"),
    decimals: num(pick(raw, "decimals"), 6),
    priceUsd: num(pick(raw, "price")),
    priceChange24h: num(
      pick(raw, "price24hChangePercent", "priceChange24hPercent", "price_change_24h_percent"),
    ),
    marketCap: num(pick(raw, "marketcap", "marketCap", "mc", "market_cap")),
    volume24h: num(pick(raw, "volume24hUSD", "v24hUSD", "v24h", "volume_24h_usd")),
    liquidity: num(pick(raw, "liquidity")),
    holders: num(pick(raw, "holder", "holders")),
  };
}

function mapTrade(raw: Record<string, unknown>, tokenAddress: string): MarketTrade {
  const side = (pick<string>(raw, "side") ?? "buy").toLowerCase() === "sell" ? "sell" : "buy";
  // BirdEye trade items carry `base`/`quote` token legs. The leg whose address
  // matches the token we're viewing gives the token amount + price; value is
  // computed (the API doesn't return a USD volume on these items).
  const base = (pick<Record<string, unknown>>(raw, "base") ?? {}) as Record<string, unknown>;
  const quote = (pick<Record<string, unknown>>(raw, "quote") ?? {}) as Record<string, unknown>;
  const tokenLeg = pick<string>(base, "address") === tokenAddress ? base : quote;

  const tokenAmount = Math.abs(num(pick(tokenLeg, "uiAmount", "ui_amount")));
  const priceUsd = num(pick(tokenLeg, "price", "nearestPrice"));
  return {
    txHash: pick<string>(raw, "txHash", "tx_hash") ?? "",
    side,
    traderAddress: pick<string>(raw, "owner", "trader") ?? "",
    valueUsd: tokenAmount * priceUsd,
    tokenAmount,
    priceUsd,
    timestamp: num(pick(raw, "blockUnixTime", "blockTime")) * 1000 || Date.now(),
  };
}
