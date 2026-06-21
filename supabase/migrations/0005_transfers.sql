-- Withdrawals (and any app-initiated transfers) recorded for the activity tab.
-- Deposits are detected from on-chain history (RPC), not stored here.
create table if not exists transfers (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null references users(id) on delete cascade,
  kind         text not null check (kind in ('deposit', 'withdraw')),
  asset        text not null check (asset in ('SOL', 'USDC')),
  amount       numeric not null,
  tx_signature text,
  created_at   timestamptz not null default now()
);

create index if not exists transfers_user_created_idx
  on transfers (user_id, created_at desc);

alter table transfers enable row level security;
