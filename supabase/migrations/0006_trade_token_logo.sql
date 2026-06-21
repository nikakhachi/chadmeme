-- Store the token logo with each trade so the feed/activity can show token
-- avatars without re-fetching from BirdEye.
alter table trades add column if not exists token_logo_uri text;
