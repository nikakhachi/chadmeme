-- Capture the token's market cap at the moment of each trade, so the activity
-- feed can show "... $VALUE at $MC MC" like the reference design.
alter table trades add column if not exists market_cap numeric;
