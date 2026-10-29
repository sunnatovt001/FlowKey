import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";
const url = "postgresql://flowza:flowza_local_only@127.0.0.1:55432/postgres";
const client = new pg.Client({ connectionString: url });
await client.connect();
const result = await client.query(
  "SELECT 1 FROM pg_database WHERE datname = 'flowza_mvp_test'",
);
if (!result.rowCount) await client.query("CREATE DATABASE flowza_mvp_test");
await client.end();
writeFileSync(
  ".env.test.local",
  [
    'DATABASE_URL="postgresql://flowza:flowza_local_only@127.0.0.1:55432/flowza_mvp_test"',
    'APP_URL="http://127.0.0.1:3100"',
    `BETTER_AUTH_SECRET="${randomBytes(32).toString("hex")}"`,
    `WEBHOOK_ENCRYPTION_KEY="${randomBytes(32).toString("hex")}"`,
    'MAIL_TRANSPORT="file"',
  ].join("\n"),
  { mode: 0o600 },
);
console.log(
  "Prepared isolated flowza_mvp_test database and ignored test environment.",
);
