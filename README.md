# ChadWallet

A fomo.family-style memecoin trading app for **Solana** — live market data, TradingView price charts, real on-chain trading, and a profile with net-worth & activity.

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
- 🪙 Token page: TradingView price chart, live trades & top holders
- 💸 Buy/sell on Solana mainnet via Jupiter — **gasless**, users pay $0 in fees (tracks positions & PnL)
- 👤 Profile: net-worth chart, activity history, crypto deposits

## Services

| Service       | Used for                          | Get a key                            |
| ------------- | --------------------------------- | ------------------------------------ |
| Privy         | Auth + embedded Solana wallets    | https://dashboard.privy.io           |
| BirdEye       | Token data, prices, OHLCV, feeds  | https://birdeye.so/data-api          |
| TradingView   | Price charts (Lightweight Charts) | https://www.tradingview.com          |
| Alchemy       | Solana mainnet RPC                | https://www.alchemy.com/rpc-api      |
| Supabase      | Postgres                          | https://supabase.com                 |
| Cloudflare R2 | Avatar uploads (S3-compatible)    | https://developers.cloudflare.com/r2 |
| Vercel        | Hosting                           | https://vercel.com                   |
