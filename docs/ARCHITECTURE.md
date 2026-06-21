# Architecture

How ChadWallet is put together, and why. Pairs with `CLAUDE.md` (conventions).

## What it is

A fomo.family-style memecoin trading app for **Solana**. Users sign in with
Google/Apple (Privy), get an embedded Solana wallet, deposit crypto, and trade
real memecoins on-chain through the Jupiter aggregator — paying **zero** network
fees because a relayer sponsors gas. Account value, positions, and PnL are derived
from **real on-chain balances** priced with BirdEye.

> This started as a paper-trading prototype; it is now **real on-chain execution**.
> The trade ledger in Postgres is no longer a virtual-cash book — it's a record of
> executed swaps used to reconstruct cost basis and drive activity/feeds.

## High-level flow

```
                    ┌─────────────────────────────────────────┐
   Browser (React)  │  Server (Next.js route handlers + RSC)   │   External
 ─────────────────  │ ───────────────────────────────────────  │ ─────────────
  Token list  ◄──── SWR ──► /api/tokens/trending ───► birdeye ─► BirdEye API
  Price chart ◄──── SWR ──► /api/tokens/[addr]/ohlcv ► birdeye ─► BirdEye API
  Trades/holders ◄─ SWR ──► /api/tokens/[addr]/...  ─► birdeye ─► BirdEye API
  Buy / Sell  ──── POST ──► /api/trade/swap ─► jupiter ────────► Jupiter API
                  (build)   + relayer sponsors gas ───────────► Solana mainnet
              ──── sign ──► Privy embedded wallet (no popup)
              ──── POST ──► /api/trade/send ─► broadcast+confirm► Solana mainnet
                                            └─► record ledger ─► Supabase
  Convert SOL⇄USDC ─ POST ► /api/convert/* ─► jupiter + relayer ► Solana mainnet
  Withdraw      ─── POST ──► /api/withdraw/* ► transfer + relayer► Solana mainnet
  Account/PnL ◄──── SWR ──► /api/account ──► on-chain balances ─► Solana + BirdEye
  Net worth   ◄──── SWR ──► /api/account/networth ─► snapshots ─► Supabase
  Activity    ◄──── SWR ──► /api/account/activity ─► ledger+RPC ► Supabase + Solana
  Auth/wallet  ── Privy SDK (client) + `x-cw-user` id (server) ► Privy
  Deposits     ── parse signatures for address ──► Alchemy RPC ► Solana mainnet
```

Why a backend-for-frontend (`/api/*`): it keeps the BirdEye / Alchemy / Supabase /
relayer secrets server-side, lets us cache and normalize responses, and gives the
client a stable contract independent of provider quirks.

## Data sources

- **BirdEye** — token metadata, prices, OHLCV candles, trending list, live trades,
  holders, search. The single source of truth for market data (`src/lib/birdeye`).
- **Jupiter** (`lite-api.jup.ag`) — swap aggregator. The server fetches a quote and
  builds an unsigned swap transaction; the client signs it (`src/lib/solana/jupiter.ts`).
- **Alchemy RPC** — Solana mainnet reads/writes: balances, deposit detection,
  broadcasting signed transactions, fee estimation (`src/lib/solana`).
- **Privy** — authentication (Google/Apple) and a per-user embedded Solana wallet.
  The wallet address is the user's deposit destination and the trading account.
- **Supabase (Postgres)** — system of record for app state that isn't on-chain: user
  profiles, the executed-trade ledger, transfers (withdraw/convert), and net-worth
  snapshots.
- **Cloudflare R2** (S3-compatible) — object storage for avatar uploads.
- **Relayer hot wallet** — a funded keypair that sponsors users' gas (see below).

## Trading model (real, on-chain)

There is no virtual cash. The flow for a buy/sell (`src/hooks/use-execute-trade.ts`):

1. **Quote + build** — `POST /api/trade/swap` gets a Jupiter quote and builds an
   unsigned swap (pay with SOL or USDC). The route then **sponsors gas** for the
   exact transaction before returning it (see below).
2. **Sign** — the Privy embedded wallet signs the transaction in-page (no popup).
3. **Broadcast + record** — `POST /api/trade/send` broadcasts, waits for on-chain
   confirmation, and appends a row to the `trades` ledger (`recordRealTrade`).

Account state (`getAccountView` in `src/lib/trading/service.ts`) is computed live:

- **Balances/positions** are read on-chain (SOL, USDC, and SPL token accounts) and
  priced with BirdEye — never stored.
- **Cost basis / PnL** is reconstructed by replaying the `trades` ledger
  (`computeAvgEntries`) against the actual holdings, using the USD value of the base
  leg actually paid/received (so price impact is reflected).
- **Net worth** = SOL + USDC + positions value; a snapshot is written on each trade
  to drive the profile chart.

Conversions (`/api/convert/*`) are Jupiter swaps between SOL and USDC inside the
user's own wallet. Withdrawals (`/api/withdraw/*`) are SOL system transfers or USDC
SPL transfers to an external address (`src/lib/solana/transfer.ts`). Both record a
row in `transfers` for the activity tab. Deposits are **not** stored — they are
detected from on-chain history (`src/lib/solana/history.ts`).

## Gasless: relayer-sponsored gas

Users should pay **0** in fees on any action. Before returning a built transaction,
each build route calls `sponsorGasForTx` (`src/lib/solana/relayer.ts`), which:

1. Computes the exact requirement from the built tx:
   `spend + getFeeForMessage(fee) + rent for any wSOL wrap / newly-opened token account`.
2. Reads the user's live SOL balance and sends only the **shortfall + dust** from the
   relayer hot wallet, awaiting confirmation so the SOL is spendable before signing.

Because the requirement is precise, the relayer funds ~0 when the user already holds
enough, and a SOL withdrawal is topped up by ~the fee rather than a flat buffer. The
UI keeps a small SOL reserve (`src/lib/sol-reserve.ts`) on SOL-input swaps so the
user fronts the refundable wSOL wrap-rent themselves. No-op when `RELAYER_SECRET_KEY`
is unset.

## Mock fallback strategy

Each `src/lib/<provider>` module exports the same functions whether or not a key is
configured, branching on the `features.has*` flags in `src/lib/env.ts`:

- **Market data** (BirdEye) returns deterministic mock data when the key is absent —
  the app boots and demos on a fresh clone with an empty `.env.local`.
- **Persistence** uses an in-memory store (`memory-store.ts`) until Supabase is wired,
  then a durable store (`supabase-store.ts`) — selected in `store.ts`.
- **Auth** falls back to a `demo-user` identity when Privy isn't configured.
- **On-chain features** (real trading, balances, gas sponsorship) require the RPC,
  Privy, and relayer keys to be set — they no-op or return empty without them.

## Database schema (Supabase / Postgres)

```
users
  id              text pk            -- external auth id (Privy user id / "demo-user")
  wallet_address  text               -- embedded Solana wallet (account + deposits)
  handle          text               -- display @handle
  avatar_url      text               -- public URL (object stored in Cloudflare R2)
  created_at      timestamptz

trades                               -- ledger of executed on-chain swaps
  id              uuid pk
  user_id         text fk -> users
  token_address   text
  token_symbol    text
  token_logo_uri  text
  side            text               -- 'buy' | 'sell'
  token_amount    numeric
  price_usd       numeric            -- effective price (value_usd / token_amount)
  value_usd       numeric            -- USD value of the base leg actually paid/received
  market_cap      numeric            -- token MC captured at trade time (for the feed)
  pay_asset       text               -- 'SOL' | 'USDC'
  tx_signature    text               -- on-chain signature
  created_at      timestamptz

transfers                            -- withdrawals + SOL⇄USDC conversions (activity)
  id              uuid pk
  user_id         text fk -> users
  kind            text               -- 'withdraw' | 'convert' | 'deposit'
  asset           text               -- 'SOL' | 'USDC' (source asset)
  amount          numeric
  to_asset        text               -- convert: destination asset
  to_amount       numeric            -- convert: destination amount
  tx_signature    text
  created_at      timestamptz

networth_snapshots                   -- profile chart
  id              uuid pk
  user_id         text fk -> users
  value_usd       numeric            -- SOL + USDC + positions value at snapshot
  created_at      timestamptz
```

RLS is enabled with no public policies; all access is server-side via the
service-role key through `/api`. SQL migrations live in `supabase/migrations`
(run with `pnpm migrate`). Notable: `0004_real_trades` turned `trades` into an
on-chain ledger; `0005`/`0007` added transfers + conversions; `0008` dropped the
paper-trading `positions` table and virtual `cash_usd`.

## Code map

```
src/
  app/(app)/            Routes: home (redirects to top trending token), token/[address], profile
  app/api/              BFF route handlers (tokens, trade, convert, withdraw, account, wallet, feed)
  components/           auth, chart, feed, layout, profile, tokens, trade, ui, watchlist
  hooks/                SWR wrappers + trade/convert/withdraw actions
  lib/
    env.ts              Type-safe env + feature flags
    birdeye/            BirdEye client + mapping + mocks (rate-limit aware)
    solana/             connection, balances, jupiter, transfer, send, history, relayer
    trading/            service (use-cases) + store abstraction (memory | supabase)
    supabase/           admin (service-role) client
    auth/               request identity (x-cw-user / demo-user)
    sol-reserve.ts      client-safe SOL "max" reserves for gasless swaps
  types/                Shared domain types (market, trading)
```
