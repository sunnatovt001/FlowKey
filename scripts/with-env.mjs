import { spawn } from "node:child_process";
const [envFile, entry, ...args] = process.argv.slice(2);
if (!envFile || !entry)
  throw new Error(
    "Usage: node scripts/with-env.mjs ENV_FILE NODE_ENTRY [ARGS]",
  );
process.loadEnvFile(envFile);
const child = spawn(process.execPath, [entry, ...args], {
  stdio: "inherit",
  env: process.env,
  windowsHide: true,
});
child.on("exit", (code) => process.exit(code || 0));
child.on("error", () => process.exit(1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
