# ChadMeme

A fomo.family-style memecoin trading app for **Solana** — real market data,
paper trading over live prices, social sign-in, net-worth tracking, and a live
token/trade experience.

> **New here?** Read [`CLAUDE.md`](./CLAUDE.md) for conventions and
> [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for how it all fits together.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in keys as you get them (all optional)
pnpm dev                     # http://localhost:3000
```

Every service key is **optional**. With an empty `.env.local`, the app boots
using realistic mock data, so you can run and demo it immediately, then wire in
real services one at a time.

### Database (only when using real Supabase)

Apply the schema once. Either paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
into the Supabase **SQL Editor** and run it, or set `DATABASE_URL` in `.env.local`
(Supabase → Connect → *Session pooler*) and run:

```bash
pnpm migrate
```

Without Supabase keys, trading uses an in-memory store and no DB is needed.

## What it does

- 🔐 Sign in with Google/Apple (Privy) + an embedded Solana wallet
- 📈 Trending tokens with live prices, market caps, and 24h change
- 🪙 Token detail: price chart, live trades, and holders
- 💸 Buy/sell with paper trading against real prices (tracks positions & PnL)
- 👤 Profile: net-worth chart, activity history, crypto deposits

## Services (free tiers)

| Service  | Used for                         | Get a key                       |
| -------- | -------------------------------- | ------------------------------- |
| Privy    | Auth + embedded Solana wallets   | https://dashboard.privy.io      |
| BirdEye  | Token data, prices, OHLCV, feeds | https://birdeye.so/data-api     |
| Alchemy  | Solana mainnet RPC               | https://www.alchemy.com/rpc-api |
| Supabase | Postgres (app state)             | https://supabase.com            |
| Vercel   | Hosting                          | https://vercel.com              |

## Tech

Next.js (App Router) · TypeScript · Tailwind v4 · SWR · TradingView Lightweight
Charts · Privy · Supabase · BirdEye · Alchemy.
