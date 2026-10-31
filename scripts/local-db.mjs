import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
const databaseDir = resolve(process.env.FLOWZA_PG_DIR || "local-data/postgres");
const port = Number(process.env.FLOWZA_PG_PORT || 5432);
const pg = new EmbeddedPostgres({
  databaseDir,
  user: "flowza",
  password: "flowza_local_only",
  port,
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: (message) => console.log(String(message).trim()),
  onError: (message) => console.error(String(message)),
});
try {
  if (!existsSync(resolve(databaseDir, "PG_VERSION"))) await pg.initialise();
  // pg_ctl drops administrative privileges on Windows. Direct postgres.exe does not.
  let stop;
  if (process.platform === "win32") {
    const { pg_ctl } = await import("@embedded-postgres/windows-x64");
    // Wait for pg_ctl itself, not pipes inherited by the background server.
    const control = (args) =>
      new Promise((resolve, reject) => {
        const child = spawn(pg_ctl, args, {
          windowsHide: true,
          stdio: "ignore",
        });
        child.once("error", reject);
        child.once("exit", (code) =>
          code === 0 ? resolve() : reject(new Error(`pg_ctl exited (${code})`)),
        );
      });
    let running = false;
    try {
      await control(["status", "-D", databaseDir]);
      running = true;
    } catch {
      /* No local server yet. */
    }
    if (!running)
      await control([
        "start",
        "-D",
        databaseDir,
        "-l",
        `${databaseDir}.log`,
        "-o",
        `-h 127.0.0.1 -p ${port}`,
        "-w",
        "-t",
        "120",
      ]);
    stop = () => control(["stop", "-D", databaseDir, "-m", "fast", "-w"]);
  } else {
    await pg.start();
    stop = () => pg.stop();
  }
  if (!process.argv.includes("--server-only")) {
    const client = pg.getPgClient("postgres", "127.0.0.1");
    await client.connect();
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'flowza'",
    );
    if (!result.rowCount) await client.query("CREATE DATABASE flowza");
    await client.end();
  }
  console.log(
    `Local PostgreSQL is ready at 127.0.0.1:${port}. Keep this terminal open. Ctrl+C stops it; data persists in local-data/.`,
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, async () => {
      await stop();
      process.exit(0);
    });
  setInterval(() => {}, 60000);
} catch (error) {
  console.error(
    "Local PostgreSQL could not start:",
    error?.message ||
      "PostgreSQL exited before becoming ready. See server output above.",
  );
  process.exit(1);
}
