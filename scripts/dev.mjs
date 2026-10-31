import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import pg from "pg";

if (existsSync(".env")) process.loadEnvFile(".env");
let databaseProcess;
let nextProcess;
async function databaseReady() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 1500,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}
function stop(signal = "SIGTERM") {
  nextProcess?.kill(signal);
  databaseProcess?.kill(signal);
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => stop(signal));
try {
  const url = new URL(process.env.DATABASE_URL || "");
  if (!(await databaseReady())) {
    const bundled =
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      (url.port || "5432") === (process.env.FLOWZA_PG_PORT || "5432") &&
      url.pathname === "/flowza" &&
      url.username === "flowza" &&
      url.password === "flowza_local_only";
    if (!bundled)
      throw new Error(
        "Sozlangan bazaga ulanib bo‘lmadi. PostgreSQL xizmatini ishga tushiring.",
      );
    console.log("Local PostgreSQL ishga tushirilmoqda…");
    databaseProcess = spawn(process.execPath, ["scripts/local-db.mjs"], {
      stdio: "inherit",
      windowsHide: true,
      env: process.env,
    });
    let startupError;
    databaseProcess.once("error", (error) => {
      startupError = error;
    });
    const deadline = Date.now() + 150_000;
    while (!(await databaseReady())) {
      if (
        startupError ||
        databaseProcess.exitCode !== null ||
        Date.now() > deadline
      )
        throw new Error(
          "Local baza tayyor bo‘lmadi. PostgreSQL logini tekshiring.",
        );
      await setTimeout(1000);
    }
  }
  console.log("Baza tayyor.");
  if (process.argv.includes("--check-db")) {
    stop();
  } else {
    nextProcess = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "dev",
        "--webpack",
        "--hostname",
        "127.0.0.1",
        ...process.argv.slice(2),
      ],
      { stdio: "inherit", windowsHide: true, env: process.env },
    );
    nextProcess.once("error", () => {
      stop();
      process.exitCode = 1;
    });
    nextProcess.once("exit", (code) => {
      databaseProcess?.kill();
      process.exitCode = code || 0;
    });
  }
} catch (error) {
  stop();
  console.error(
    error instanceof Error ? error.message : "Local server ishga tushmadi.",
  );
  process.exitCode = 1;
}
