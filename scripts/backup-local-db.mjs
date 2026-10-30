import pg from "pg";
const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error(
    "This snapshot helper only supports the configured local database.",
  );
const source = decodeURIComponent(url.pathname.slice(1));
if (!/^[a-zA-Z0-9_]+$/.test(source))
  throw new Error("Unsupported database name.");
const snapshot = `${source.slice(0, 22)}_before_ops_${Date.now()}`;
url.pathname = "/postgres";
const client = new pg.Client({
  connectionString: url.href,
  connectionTimeoutMillis: 5000,
});
try {
  await client.connect();
  // PostgreSQL refuses to copy a template with active connections; never terminate them here.
  await client.query(`CREATE DATABASE "${snapshot}" WITH TEMPLATE "${source}"`);
  console.log(`Local database snapshot created: ${snapshot}`);
} finally {
  await client.end();
}
