import { readdir, readFile, stat } from "node:fs/promises";
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

export async function verificationCode(email: string, type = "email-verification") {
  const directory = "local-data/mail";
  const files = await Promise.all((await readdir(directory)).map(async name => ({ name, mtime: (await stat(`${directory}/${name}`)).mtimeMs })));
  for (const { name } of files.sort((a, b) => b.mtime - a.mtime)) {
    const mail = JSON.parse(await readFile(`${directory}/${name}`, "utf8"));
    if (mail.to === email && mail.type === type && /^\d{6}$/.test(mail.otp)) return mail.otp as string;
  }
  throw new Error("Verification code not found in the isolated local inbox.");
}
