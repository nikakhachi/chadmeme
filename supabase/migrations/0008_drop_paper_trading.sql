-- Remove paper-trading artifacts: positions are now read on-chain, and there is
-- no virtual cash balance.
drop table if exists positions;
alter table users drop column if exists cash_usd;
