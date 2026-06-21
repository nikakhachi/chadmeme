/**
 * Deterministic mock market data.
 *
 * Used automatically whenever BIRDEYE_API_KEY is absent so the app is fully
 * demoable on a fresh clone. Values are seeded from the token address so the
 * same token always produces the same chart/trades (stable across renders).
 */
import type {
  Candle,
  ChartInterval,
  Holder,
  MarketTrade,
  Token,
  TokenDetail,
} from "@/types/market";

/** Small seeded PRNG (mulberry32) for reproducible mock series. */
function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (Math.imul(hash, 31) + address.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

/** The trending list, mirroring the kinds of tokens fomo surfaces. */
export const MOCK_TOKENS: Token[] = [
  mockToken("DAEMON", "Daemon", 0.00139, 443.03, 1_300_000, 1_100_000, 50_500, 974, "4vpf4qDaemonpump00000000000000000000000N5pump"),
  mockToken("ICPX", "ICPX", 0.000615, 206.47, 614_500, 740_000, 41_000, 612, "ICPXmock0000000000000000000000000000000000"),
  mockToken("FARM", "Farm", 0.00139, -25.42, 1_300_000, 320_000, 88_000, 1530, "FARMmock0000000000000000000000000000000000"),
  mockToken("glippy", "glippy", 0.00032, 15185.5, 319_600, 410_000, 33_000, 845, "glippymock00000000000000000000000000000000"),
  mockToken("JOTCHUA", "Jotchua", 0.00652, 34.13, 6_500_000, 2_100_000, 220_000, 4120, "JOTCHUAmock000000000000000000000000000000"),
  mockToken("JAMESON", "Jameson", 0.000342, -61.75, 342_000, 95_000, 28_000, 533, "JAMESONmock000000000000000000000000000000"),
  mockToken("APU", "Apu Apustaja", 0.000971, 198.8, 970_400, 540_000, 130_000, 2980, "APUmock00000000000000000000000000000000000"),
  mockToken("ZERO", "Zero", 0.0111, 106.78, 10_900_000, 3_400_000, 410_000, 6700, "ZEROmock0000000000000000000000000000000000"),
  mockToken("ANSEM", "Ansem", 0.00156, 20.1, 1_500_000, 600_000, 95_000, 1820, "ANSEMmock000000000000000000000000000000000"),
  mockToken("ASTEROID", "Asteroid", 0.00014, -7.05, 58_900_000, 9_200_000, 1_800_000, 24500, "ASTEROIDmock00000000000000000000000000000"),
  mockToken("GutGenug", "Gut Genug", 0.000451, 44.98, 450_700, 180_000, 36_000, 990, "GUTGENUGmock00000000000000000000000000000"),
  mockToken("HERMESWORLD", "Hermes World", 0.00031, 12.4, 1_100_000, 420_000, 60_000, 1340, "HERMESmock000000000000000000000000000000"),
];

function mockToken(
  symbol: string,
  name: string,
  priceUsd: number,
  priceChange24h: number,
  marketCap: number,
  volume24h: number,
  liquidity: number,
  holders: number,
  address: string,
): Token {
  return {
    address,
    symbol,
    name,
    decimals: 6,
    priceUsd,
    priceChange24h,
    marketCap,
    volume24h,
    liquidity,
    holders,
    logoURI: undefined,
  };
}

export function mockTrendingTokens(limit = 50): Token[] {
  return MOCK_TOKENS.slice(0, limit);
}

/** Deterministic mock price for any address (known tokens use their listed price). */
export function mockPrice(address: string): number {
  const known = MOCK_TOKENS.find((t) => t.address === address);
  if (known) return known.priceUsd;
  const rand = seededRandom(seedFromAddress(address));
  return 0.0001 + rand() * 0.01;
}

export function mockTokenDetail(address: string): TokenDetail {
  const base =
    MOCK_TOKENS.find((t) => t.address === address) ?? {
      ...MOCK_TOKENS[0],
      address,
    };
  return {
    ...base,
    description:
      "We built an entire IDE from scratch. Not a VS Code fork. A native, fast, agent-first development environment for shipping memes.",
    website: "https://example.com",
    twitter: "https://x.com/example",
    telegram: "https://t.me/example",
    supply: base.marketCap / base.priceUsd,
    top10HoldersPercent: 23.94,
  };
}

const INTERVAL_SECONDS: Record<ChartInterval, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1H": 3600,
  "4H": 14400,
  "1D": 86400,
};

export function mockCandles(
  address: string,
  interval: ChartInterval,
  count = 150,
): Candle[] {
  const token = MOCK_TOKENS.find((t) => t.address === address) ?? MOCK_TOKENS[0];
  const rand = seededRandom(seedFromAddress(address));
  const step = INTERVAL_SECONDS[interval];
  const now = Math.floor(Date.now() / 1000);
  const start = now - step * count;

  const candles: Candle[] = [];
  let price = token.priceUsd * 0.6;
  for (let i = 0; i < count; i++) {
    const drift = (rand() - 0.46) * price * 0.08;
    const open = price;
    const close = Math.max(price + drift, token.priceUsd * 0.05);
    const high = Math.max(open, close) * (1 + rand() * 0.03);
    const low = Math.min(open, close) * (1 - rand() * 0.03);
    const volume = token.volume24h / count * (0.4 + rand() * 1.6);
    candles.push({
      time: start + i * step,
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }
  return candles;
}

const TRADER_HANDLES = [
  "31337___", "fibs", "PixelChad", "darkuwu", "kingprodi", "zhynx",
  "leyten", "Cryptoaeon", "belfort", "pingucharts", "runitbackx9", "jimbo",
];

export function mockTrades(address: string, count = 40): MarketTrade[] {
  const token = MOCK_TOKENS.find((t) => t.address === address) ?? MOCK_TOKENS[0];
  const rand = seededRandom(seedFromAddress(address) + 7);
  const trades: MarketTrade[] = [];
  for (let i = 0; i < count; i++) {
    const side = rand() > 0.46 ? "buy" : "sell";
    const valueUsd = 50 + rand() * 9000;
    const priceUsd = token.priceUsd * (0.95 + rand() * 0.1);
    trades.push({
      txHash: `mockTx${address.slice(0, 6)}${i}${Math.floor(rand() * 1e6)}`,
      side,
      traderAddress: `${TRADER_HANDLES[i % TRADER_HANDLES.length]}wallet0000000000000000`,
      valueUsd,
      tokenAmount: valueUsd / priceUsd,
      priceUsd,
      timestamp: Date.now() - i * (15_000 + rand() * 45_000),
    });
  }
  return trades;
}

export function mockHolders(address: string, count = 20): Holder[] {
  const token = MOCK_TOKENS.find((t) => t.address === address) ?? MOCK_TOKENS[0];
  const rand = seededRandom(seedFromAddress(address) + 13);
  const supply = token.marketCap / token.priceUsd;
  const holders: Holder[] = [];
  let remaining = 0.45; // top holders own ~45% combined
  for (let i = 0; i < count; i++) {
    const share = remaining * (0.15 + rand() * 0.25);
    remaining = Math.max(remaining - share, 0.002);
    const tokenAmount = supply * share;
    holders.push({
      ownerAddress: `holder${i}${address.slice(0, 6)}0000000000000000000000`,
      tokenAmount,
      valueUsd: tokenAmount * token.priceUsd,
      percentage: share * 100,
    });
  }
  return holders.sort((a, b) => b.tokenAmount - a.tokenAmount);
}
