-- ChadWallet initial schema (paper trading).
--
-- Apply via the Supabase SQL editor or the Supabase CLI:
--   supabase db push      (CLI)   — or paste this file into the dashboard editor.
--
-- The server accesses these tables with the service-role key (bypasses RLS).
-- RLS is enabled with no public policies, so the anon key cannot read/write
-- directly — all access goes through our /api routes.

-- Users: keyed by the external auth id (Privy user id, or "demo-user").
create table if not exists users (
  id             text primary key,
  wallet_address text,
  handle         text,
  cash_usd       numeric not null default 10000,
  created_at     timestamptz not null default now()
);

-- Open positions (one row per user+token).
create table if not exists positions (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references users(id) on delete cascade,
  token_address  text not null,
  token_symbol   text not null,
  token_logo_uri text,
  amount         numeric not null,
  avg_entry_usd  numeric not null,
  cost_basis_usd numeric not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, token_address)
);

-- Immutable trade history (activity feed).
create table if not exists trades (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references users(id) on delete cascade,
  token_address text not null,
  token_symbol  text not null,
  side          text not null check (side in ('buy', 'sell')),
  token_amount  numeric not null,
  price_usd     numeric not null,
  value_usd     numeric not null,
  created_at    timestamptz not null default now()
);

-- Net-worth snapshots (profile chart).
create table if not exists networth_snapshots (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references users(id) on delete cascade,
  value_usd  numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists trades_user_created_idx
  on trades (user_id, created_at desc);
create index if not exists networth_user_created_idx
  on networth_snapshots (user_id, created_at);

alter table users enable row level security;
alter table positions enable row level security;
alter table trades enable row level security;
alter table networth_snapshots enable row level security;
