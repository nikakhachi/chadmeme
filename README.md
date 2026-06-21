# ChadWallet

A **fomo.family-style memecoin trading app for Solana** — built as the Founding
Engineer assessment. Sign in with Google/Apple, get an embedded Solana wallet,
deposit crypto, and **trade real memecoins on-chain** with live market data, price
charts, live trades & holders, a net-worth chart, and full activity history.

Built end-to-end on real data and real on-chain execution — **not** a paper-trading
mock. Users trade through the Jupiter aggregator and pay **zero gas** (a relayer
sponsors fees).

> **For reviewers:** the section [**Brief → Implementation**](#brief--implementation)
> below maps every item from the screening brief to exactly where and how it's
> delivered. Deeper design notes live in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md);
> conventions in [`CLAUDE.md`](./CLAUDE.md).

---

## Brief → Implementation

Everything in the screening brief, and where it lives in the app.

### Product requirements

| # | Instructed | Delivered | Where |
| - | ---------- | --------- | ----- |
| 1 | **Supports Solana** | All trading, balances, deposits and withdrawals run on Solana mainnet | `src/lib/solana/*` |
| 2 | **Sign in with Google/Apple + basic profile** | Privy social login + per-user embedded Solana wallet; editable username + avatar | `src/components/auth`, `profile` |
| 2a | → **Net-worth chart** | Live total value (SOL + USDC + positions), snapshotted on each trade | `profile/NetworthChart.tsx`, `/api/account/networth` |
| 2b | → **Activity history** | Unified timeline: trades + withdrawals + conversions + on-chain deposits | `profile/ActivityHistory.tsx`, `/api/account/activity` |
| 3 | **Deposit with crypto** | Deposit address + QR; incoming SOL/USDC detected from on-chain history | `profile/DepositButton.tsx`, `src/lib/solana/history.ts` |
| 4 | **Trending tokens list** | Live trending tokens with price, market cap, 24h change + search | `layout/TokenSidebar.tsx`, `/api/tokens/trending` |
| 5 | **Trading** | Real on-chain buy/sell via Jupiter | `trade/`, `/api/trade/*` |
| 5a | → **Token info + price chart** | Token detail page with TradingView Lightweight Charts (candles/line, intervals, price/MCap) | `chart/`, `token/[address]` |
| 5b | → **Buy and sell** | Buy/sell with SOL **or** USDC; embedded-wallet signing, no popups | `trade/TradePanel.tsx`, `use-execute-trade.ts` |
| 5c | → **Live trades and holders** | Live trade feed + top holders for each token | `trade/TradesFeed.tsx`, `HoldersTable.tsx` |

### Tools (as specified)

| # | Required | Used for |
| - | -------- | -------- |
| 1 | **AI tools** | Built with AI-assisted development (Claude Code) throughout |
| 2 | **Next.js + Tailwind** | Next.js 16 (App Router, RSC) + Tailwind v4 |
| 3 | **Postgres/Supabase, S3/Cloudflare, Vercel** | Supabase Postgres (app state), Cloudflare R2 (avatar uploads), Vercel (hosting) |
| 5 | **Privy** | Google/Apple auth + embedded Solana wallets — https://privy.io |
| 6 | **BirdEye** | Token data, prices, OHLCV, live trades, holders — https://birdeye.so/data-api |
| 7 | **Alchemy RPC** | Solana mainnet reads/writes — https://www.alchemy.com/rpc-api |
| 8 | **TradingView** | Price charts (Lightweight Charts) — https://www.tradingview.com |

### Tips followed

- **Powered by real data** — live BirdEye market data and real on-chain Solana
  balances/execution, not mocks (mocks exist only as a graceful fallback so the app
  still boots without keys).
- **All free tiers** — every service used has a free tier, as suggested.

---

## Beyond the brief

Initiative taken to make it feel like a real product, not a demo:

- **Real on-chain trading** via the **Jupiter** aggregator — buy/sell memecoins with
  SOL or USDC, signed in-page by the Privy embedded wallet (no wallet popups).
- **Gasless UX** — a relayer hot wallet sponsors the **exact** gas of every action,
  so users pay **0 fees** on trades, conversions, and withdrawals.
- **SOL ⇄ USDC conversion** and **withdrawals** to any external Solana address.
- **Live PnL** reconstructed from an on-chain trade ledger against real holdings.

---

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in keys as you get them (all optional)
pnpm dev                     # http://localhost:3000
```

Every service key is **optional**. With an empty `.env.local`, the app boots using
realistic mock market data so you can run and explore it immediately, then wire in
real services one at a time. Real **trading** (on-chain execution + gasless) needs
the Alchemy RPC, Privy, and relayer keys.

### Database (only when using real Supabase)

Apply the schema once — either paste the files in
[`supabase/migrations/`](supabase/migrations) into the Supabase **SQL Editor**, or
set `DATABASE_URL` in `.env.local` (Supabase → Connect → *Session pooler*) and run:

```bash
pnpm migrate
```

Without Supabase keys, the trade ledger / profiles use an in-memory store and no DB
is needed.

## Services & keys

| Service        | Used for                                   | Get a key                       |
| -------------- | ------------------------------------------ | ------------------------------- |
| Privy          | Auth + embedded Solana wallets             | https://dashboard.privy.io      |
| BirdEye        | Token data, prices, OHLCV, trades, holders | https://birdeye.so/data-api     |
| Alchemy        | Solana mainnet RPC                         | https://www.alchemy.com/rpc-api |
| Supabase       | Postgres (profiles, ledger, snapshots)     | https://supabase.com            |
| Cloudflare R2  | Avatar uploads (S3-compatible)             | https://developers.cloudflare.com/r2 |
| Relayer wallet | Gas sponsorship (`RELAYER_SECRET_KEY`)     | any funded Solana keypair       |
| Vercel         | Hosting                                    | https://vercel.com              |

## Tech stack

Next.js 16 (App Router, RSC) · TypeScript · Tailwind v4 · SWR · Zod ·
TradingView Lightweight Charts · Privy · Jupiter · Solana web3.js + SPL-Token ·
BirdEye · Alchemy · Supabase (Postgres) · Cloudflare R2 · Vercel.

## How it works (1-minute version)

The client talks only to our own `/api/*` backend-for-frontend, which holds every
secret and normalizes provider responses. A trade is: **build** an unsigned Jupiter
swap on the server (which sponsors its gas), **sign** it with the Privy embedded
wallet in-page, then **broadcast + confirm + record** it. Account value and PnL are
derived live from real on-chain balances priced by BirdEye, with cost basis replayed
from the trade ledger. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the
full picture.
