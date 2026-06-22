# ChadWallet — Engineering Guide

A fomo.family-style memecoin trading app for **Solana**. Real market data, paper
trading (virtual cash over live prices), Google/Apple sign-in, net-worth + activity.

This file is the entry point for any developer or AI agent working in the repo.
Read it first. Keep it current when you change architecture or conventions.

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | Next.js (App Router) + React + TypeScript |
| Styling        | Tailwind CSS v4 (tokens in `globals.css`) |
| Auth + wallets | Privy (Google/Apple + embedded Solana wallet) |
| Database       | Supabase (Postgres)                      |
| Market data    | BirdEye Data API                         |
| On-chain RPC   | Alchemy (Solana mainnet)                 |
| Price chart    | TradingView Lightweight Charts           |
| Data fetching  | SWR (client), `fetch` (server)           |
| Hosting        | Vercel                                   |

## Commands

```bash
pnpm dev        # local dev server (http://localhost:3000)
pnpm build      # production build
pnpm lint       # eslint
```

## Golden rules

1. **Real data, graceful mocks.** Every external service key is optional (see
   `src/lib/env.ts`). When a key is missing, that data source returns realistic
   mock data so the app always boots and is demoable. Never hard-crash on a
   missing key.
2. **Provider responses are mapped at the edge.** UI consumes the normalized
   types in `src/types`. Only `src/lib/<provider>` knows a provider's raw shape.
3. **Secrets stay on the server.** Anything without `NEXT_PUBLIC_` is server-only
   and may only be imported by route handlers / server components / actions.
4. **Trading is paper trading behind an interface.** All execution flows through
   `src/lib/trading`. Real on-chain swaps can replace the engine without touching
   the UI.
5. **Small, named, single-purpose files.** Co-locate by feature. Prefer clarity
   over cleverness — another dev should understand a file in one read.

## Folder structure

```
src/
  app/                 Next.js App Router (routes, layouts, API route handlers)
    api/               Backend-for-frontend route handlers
  components/
    ui/                Generic primitives (Button, Card, Skeleton, ...)
    layout/            App shell (sidebar, top bar, panels)
    tokens/            Token list + rows
    trade/             Buy/sell panel, trade feed, holders
    chart/             Lightweight Charts wrapper
  lib/
    env.ts             Type-safe env + feature flags
    utils.ts           cn() + formatters (money, %, address, time)
    birdeye/           BirdEye client + response mapping + mocks
    solana/            Alchemy RPC helpers
    supabase/          DB clients (browser + server) + queries
    trading/           Paper-trading engine
  types/               Shared domain types (market, trading)
  hooks/               Reusable client hooks (SWR wrappers)
docs/                  Deeper design docs (see ARCHITECTURE.md)
```

## Conventions

- **Imports:** absolute via `@/` (e.g. `@/lib/utils`).
- **Server vs client:** default to Server Components. Add `"use client"` only
  when a file needs state, effects, or browser APIs.
- **Formatting money/percent/addresses:** always use helpers in `src/lib/utils.ts`
  so display is consistent (e.g. `$1.3M`, `+442.81%`, `4vpf4q...N5pump`).
- **Colors:** use semantic Tailwind tokens (`text-up`, `text-down`, `bg-panel`,
  `border-line`, `bg-brand`) — never raw hex in components.
- **Data fetching:** server reads call `src/lib/*` directly; client reads use SWR
  hooks in `src/hooks` that hit our `/api/*` route handlers.

## Current status

See `docs/ARCHITECTURE.md` for the data model and the build roadmap / checklist.
