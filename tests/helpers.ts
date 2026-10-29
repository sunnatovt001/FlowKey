import { readdir, readFile } from "node:fs/promises";
if (
  process.env.FLOWZA_TEST_URL &&
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.FLOWZA_TEST_URL).hostname,
  )
)
  throw new Error(
    "Integration tests require an isolated loopback test server.",
  );
if (process.env.FLOWZA_TEST_URL) {
  const database = new URL(
    process.env.DATABASE_URL || "postgresql://invalid/invalid",
  );
  if (
    !["localhost", "127.0.0.1"].includes(database.hostname) ||
    !database.pathname.endsWith("_test")
  )
    throw new Error(
      "Integration tests require a loopback database with an _test suffix.",
    );
}
export async function verificationUrl(email: string, subject = "tasdiqlash") {
  for (const file of await readdir("local-data/mail")) {
    const mail = JSON.parse(await readFile(`local-data/mail/${file}`, "utf8"));
    if (mail.to === email && mail.subject.includes(subject))
      return mail.url as string;
  }
  throw new Error(
    "Verification email not found in the local development inbox.",
  );
}
