import pg from "pg";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const source = new URL(process.env.DATABASE_URL || "");
if (source.hostname !== "127.0.0.1" || source.pathname !== "/flowza_mvp_test")
  throw new Error(
    "Restore rehearsal only accepts the isolated loopback flowza_mvp_test database.",
  );
const name = `flowza_restore_${Date.now()}`;
const target = new URL(source);
target.pathname = `/${name}`;
const adminUrl = new URL(source);
adminUrl.pathname = "/postgres";
const admin = new pg.Client({ connectionString: adminUrl.href });
const client = new pg.Client({ connectionString: source.href });
const restored = new pg.Client({ connectionString: target.href });
const tables = [
  "User",
  "Account",
  "Session",
  "Verification",
  "Business",
  "OnboardingDraft",
  "Project",
  "Membership",
  "ApiKey",
  "Transaction",
  "PaymentEvent",
  "WebhookEndpoint",
  "WebhookDelivery",
  "WebhookDeliveryAttempt",
  "AuditLog",
  "RateLimit",
  "AuthRateLimit",
];
await admin.connect();
await client.connect();
let created = false,
  connected = false;
try {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const snapshot = {};
  for (const table of tables)
    snapshot[table] = (
      await client.query(
        `SELECT row_to_json(record) AS value FROM "${table}" AS record`,
      )
    ).rows.map((row) => row.value);
  await client.query("COMMIT");
  await mkdir("output", { recursive: true });
  await writeFile("output/test-data-backup.json", JSON.stringify(snapshot), {
    mode: 0o600,
  });
  await admin.query(`CREATE DATABASE "${name}"`);
  created = true;
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      {
        env: { ...process.env, DATABASE_URL: target.href },
        stdio: "ignore",
        windowsHide: true,
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("Restore schema migration failed.")),
    );
  });
  await restored.connect();
  connected = true;
  await restored.query("BEGIN");
  for (const table of tables)
    if (snapshot[table].length)
      await restored.query(
        `INSERT INTO "${table}" SELECT * FROM json_populate_recordset(NULL::"${table}", $1::json)`,
        [JSON.stringify(snapshot[table])],
      );
  await restored.query("COMMIT");
  for (const table of tables) {
    const count = Number(
      (await restored.query(`SELECT count(*) AS count FROM "${table}"`)).rows[0]
        .count,
    );
    if (count !== snapshot[table].length)
      throw new Error(`Restore row count mismatch: ${table}`);
  }
  if (!snapshot.Transaction.length)
    throw new Error("Create sandbox transactions before restore rehearsal.");
  console.log(
    "Isolated logical data restore passed: schema migrations, foreign keys and all public application table counts verified. Production PITR/pg_dump remains an operator requirement.",
  );
} finally {
  if (connected) await restored.end();
  await client.end();
  if (created && /^flowza_restore_\d+$/.test(name))
    await admin.query(`DROP DATABASE "${name}"`);
  await admin.end();
}
