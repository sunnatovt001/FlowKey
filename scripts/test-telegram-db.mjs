import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import pg from "pg";
if (existsSync(".env")) process.loadEnvFile(".env");
const source = new URL(process.env.DATABASE_URL || "");
if (!["localhost", "127.0.0.1"].includes(source.hostname))
  throw Error("Telegram DB tests require a loopback database.");
const adminUrl = new URL(source);
adminUrl.pathname = "/postgres";
const client = new pg.Client({ connectionString: adminUrl.href });
await client.connect();
try {
  const exists = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'flowkey_support_test'",
  );
  if (!exists.rowCount)
    await client.query("CREATE DATABASE flowkey_support_test");
} finally {
  await client.end();
}
const testUrl = new URL(source);
testUrl.pathname = "/flowkey_support_test";
const env = {
  ...process.env,
  DATABASE_URL: testUrl.href,
  FLOWKEY_SUPPORT_DB_TEST: "1",
};
execFileSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { env, stdio: "inherit", windowsHide: true },
);
execFileSync(
  process.execPath,
  ["--import", "tsx", "--test", "tests/telegram-db.test.ts"],
  { env, stdio: "inherit", windowsHide: true },
);
