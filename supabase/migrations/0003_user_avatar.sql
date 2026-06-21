-- Profile picture URL (object stored in Cloudflare R2; this is the public URL).
alter table users add column if not exists avatar_url text;
