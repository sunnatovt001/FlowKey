import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (!existsSync(".env")) {
  writeFileSync(
    ".env",
    readFileSync(".env.example", "utf8")
      .replace(
        'BETTER_AUTH_SECRET=""',
        `BETTER_AUTH_SECRET="${randomBytes(32).toString("hex")}"`,
      )
      .replace(
        'WEBHOOK_ENCRYPTION_KEY=""',
        `WEBHOOK_ENCRYPTION_KEY="${randomBytes(32).toString("hex")}"`,
      ),
  );
  console.log("Created ignored .env with a random webhook encryption key.");
} else {
  let existing = readFileSync(".env", "utf8");
  const additions = [];
  const authSecret = existing
    .match(/^BETTER_AUTH_SECRET=(.*)$/m)?.[1]
    ?.replace(/^["']|["']$/g, "");
  if (!authSecret || authSecret.length < 32) {
    existing = existing.replace(/^BETTER_AUTH_SECRET=.*\r?\n?/m, "");
    additions.push(`BETTER_AUTH_SECRET="${randomBytes(32).toString("hex")}"`);
  }
  if (!/^MAIL_TRANSPORT=/m.test(existing))
    additions.push('MAIL_TRANSPORT="file"');
  if (additions.length)
    writeFileSync(".env", `${existing}\n${additions.join("\n")}\n`);
  console.log(
    "Preserved existing .env; added missing auth/local email settings if needed.",
  );
}
