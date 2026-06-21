-- Real-trading: the trades table becomes a ledger of executed on-chain swaps.
-- Records the transaction signature and which base asset (SOL/USDC) was used.
alter table trades add column if not exists tx_signature text;
alter table trades add column if not exists pay_asset text; -- 'SOL' | 'USDC'

create index if not exists trades_tx_signature_idx on trades (tx_signature);
