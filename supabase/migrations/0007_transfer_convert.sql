-- Allow recording SOL<->USDC conversions in the transfers table for the
-- activity tab (with the destination asset + amount).
alter table transfers drop constraint if exists transfers_kind_check;
alter table transfers add constraint transfers_kind_check
  check (kind in ('deposit', 'withdraw', 'convert'));
alter table transfers add column if not exists to_asset text;
alter table transfers add column if not exists to_amount numeric;
