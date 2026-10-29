import { existsSync } from "node:fs";
import { db } from "../server/db";
import { createAdminSetup } from "../server/telegram/admin-setup";
if (existsSync(".env")) process.loadEnvFile(".env");
try {
  console.log(JSON.stringify(await createAdminSetup()));
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Admin havolasini yaratib bo‘lmadi.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
