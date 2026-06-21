/**
 * Minimal SQL migration runner.
 *
 * Applies every file in supabase/migrations (sorted) to the database in
 * DATABASE_URL. Statements are idempotent (CREATE TABLE IF NOT EXISTS ...), so
 * re-running is safe.
 *
 * Usage:
 *   DATABASE_URL="postgresql://...":  pnpm migrate
 * Get the URL from Supabase → Connect → "Session pooler" (IPv4-friendly).
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL is not set. See scripts/migrate.mjs header.");
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    process.stdout.write(`→ applying ${file} ... `);
    await client.query(sql);
    console.log("ok");
  }
  console.log(`✓ Applied ${files.length} migration(s).`);
} catch (err) {
  console.error("✗ Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
