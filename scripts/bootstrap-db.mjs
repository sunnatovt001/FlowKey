import pg from "pg";
const client = new pg.Client({
  host: "127.0.0.1",
  port: 5432,
  database: "postgres",
  user: "flowza",
  password: "flowza_local_only",
});
try {
  await client.connect();
  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname='flowza'",
  );
  if (!result.rowCount) await client.query("CREATE DATABASE flowza");
  console.log("Development database ready.");
} finally {
  await client.end();
}
