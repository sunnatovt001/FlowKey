import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export async function sendAuthEmail(to: string, subject: string, url: string) {
  if (
    process.env.MAIL_TRANSPORT === "file" &&
    process.env.NODE_ENV !== "production"
  ) {
    await mkdir("local-data/mail", { recursive: true });
    await writeFile(
      `local-data/mail/${randomUUID()}.json`,
      JSON.stringify({ to, subject, url }),
      { mode: 0o600 },
    );
    return;
  }
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM)
    throw new Error("Elektron xat yuborish sozlanmagan.");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    requireTLS: true,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text: `${subject}\n\n${url}\n\nAgar buni siz so‘ramagan bo‘lsangiz, xatga e’tibor bermang.`,
  });
}
