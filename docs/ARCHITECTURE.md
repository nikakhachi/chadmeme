# Architecture

How ChadWallet is put together, and why. Pairs with `CLAUDE.md` (conventions).

## High-level flow

```
                    ┌─────────────────────────────────────────┐
   Browser (React)  │  Server (Next.js route handlers + RSC)   │   External
 ─────────────────  │ ───────────────────────────────────────  │ ─────────────
  Token list  ◄──── SWR ──► /api/tokens/trending ──► birdeye ──► BirdEye API
  Price chart ◄──── SWR ──► /api/tokens/[addr]/ohlcv ─► birdeye ─► BirdEye API
  Trade feed  ◄──── SWR ──► /api/tokens/[addr]/trades ► birdeye ─► BirdEye API
  Buy / Sell  ────── POST ─► /api/trade ──► trading engine ──► Supabase (Postgres)
  Net worth   ◄──── SWR ──► /api/account ──► trading engine ──► Supabase
  Auth/wallet  ── Privy SDK (client) + token verify (server) ──► Privy
  Deposits     ── watch address ──► solana/Alchemy RPC ──────► Solana mainnet
```

Why a backend-for-frontend (`/api/*`): it keeps the BirdEye/Alchemy/Supabase
service-role keys server-side, lets us cache and normalize responses, and gives
the client a stable contract independent of provider quirks.

## Data sources

- **BirdEye** — token metadata, prices, OHLCV candles, trending list, live
  trades, holders. The single source of truth for market data.
- **Alchemy RPC** — Solana mainnet reads: deposit detection (watch the user's
  embedded wallet for incoming SOL/USDC), balances.
- **Privy** — authentication (Google/Apple) and an embedded Solana wallet per
  user. The wallet address is the user's deposit destination.
- **Supabase** — our system of record for app state: users, positions, trades,
  net-worth snapshots, virtual cash balance.

## Mock fallback strategy

Each `src/lib/<provider>` module exports the same functions whether or not a key
is configured. Internally it checks the relevant `features.has*` flag from
`src/lib/env.ts` and returns deterministic mock data when the key is absent. This
means:

- `pnpm dev` works on a fresh clone with an empty `.env.local`.
- Services can be wired in one at a time; the rest keep working.
- Demos never show a blank screen due to a missing key.

## Trading model (paper trading)

Users start with a virtual USD cash balance. Buys/sells execute against the live
BirdEye price:

- **Buy**: `cash -= valueUsd`; create/increase a `position`; weighted-avg entry.
- **Sell**: `cash += valueUsd`; decrease/close the `position`; realize PnL.
- Every fill writes an immutable `trade` row (activity history).
- A periodic snapshot writes `networth` points (cash + positions value) for the
  profile chart.

The execution boundary is `src/lib/trading`. To go to real on-chain swaps later,
replace the engine's `executeTrade` with a Jupiter swap via the Privy wallet; the
API contract and UI stay the same.

## Database schema (Supabase / Postgres)

```
users
  id              text pk            -- external auth id (Privy id / "demo-user")
  wallet_address  text               -- embedded Solana wallet (deposits)
  handle          text               -- display @handle
  cash_usd        numeric            -- virtual cash balance (default 10000)
  created_at      timestamptz

positions
  id              uuid pk
  user_id         text fk -> users
  token_address   text
  token_symbol    text
  token_logo_uri  text
  amount          numeric            -- tokens held
  avg_entry_usd   numeric            -- weighted avg entry price
  cost_basis_usd  numeric            -- USD cost of current holdings
  updated_at      timestamptz
  unique (user_id, token_address)

trades
  id              uuid pk
  user_id         text fk -> users
  token_address   text
  token_symbol    text
  side            text               -- 'buy' | 'sell'
  token_amount    numeric
  price_usd       numeric
  value_usd       numeric
  created_at      timestamptz

networth_snapshots
  id              uuid pk
  user_id         text fk -> users
  value_usd       numeric            -- cash + positions value at snapshot
  created_at      timestamptz
```

SQL migrations live in `supabase/migrations`.

## Roadmap / checklist

- [x] Project scaffold, env config, design tokens, domain types, docs
- [x] App shell (sidebar token list, top search bar, right rail)
- [x] BirdEye data layer (trending, token, OHLCV, trades, holders, prices) + mocks
- [x] Paper-trading engine + buy/sell + positions/PnL (in-memory store)
- [x] Auth abstraction (unified `useAuth`, Privy + mock bridges)
- [x] Token detail page: chart + trade panel + live trades & holders
- [x] Profile: net-worth chart, activity history, crypto deposit flow
- [ ] Wire real keys (Privy, BirdEye, Alchemy) + verify BirdEye field mapping
- [ ] Supabase schema + durable store implementation
- [ ] Alchemy deposit watcher (credit cash on on-chain transfer)
- [ ] Deploy to Vercel + share live preview
