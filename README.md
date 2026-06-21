# ChadMeme

A fomo.family-style memecoin trading app for **Solana** — live market data,
price charts, live trades & activity profile net-worth tracking

> Read [`CLAUDE.md`](./CLAUDE.md) for conventions and
> [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for how it all fits together.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in keys as you get them (all optional)
pnpm dev                     # http://localhost:3000
```

## What it does

- 🔐 Sign in with Google or any Email + an embedded Solana wallet
- 📈 Browse Trending memecoins with live prices, market caps, and 24h change
- 💸 Buy/sell tokens on Solana mainnet (tracks positions & PnL)
- 👤 Profile: net-worth chart, activity history, crypto deposits

## Services

| Service  | Used for                         | Get a key                       |
| -------- | -------------------------------- | ------------------------------- |
| Privy    | Auth + embedded Solana wallets   | https://dashboard.privy.io      |
| BirdEye  | Token data, prices, OHLCV, feeds | https://birdeye.so/data-api     |
| Alchemy  | Solana mainnet RPC               | https://www.alchemy.com/rpc-api |
| Supabase | Postgres                         | https://supabase.com            |
| Vercel   | Hosting                          | https://vercel.com              |
