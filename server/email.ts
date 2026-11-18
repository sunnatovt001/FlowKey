import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

type AuthMail = { to: string; subject: string; text: string; html?: string; url?: string; otp?: string; type?: string };
async function deliver(mail: AuthMail) {
  if (process.env.MAIL_TRANSPORT === "file" && process.env.NODE_ENV !== "production") {
    await mkdir("local-data/mail", { recursive: true });
    await writeFile(`local-data/mail/${randomUUID()}.json`, JSON.stringify(mail), { mode: 0o600 });
    return;
  }
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) {
    console.error(JSON.stringify({ event: "mail.failed", code: "NOT_CONFIGURED" }));
    throw new Error("Elektron xat yuborish sozlanmagan.");
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    requireTLS: true,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    logger: false,
    debug: false,
  });
  try {
    const result = await transport.sendMail({ from: process.env.MAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
    if (!result.accepted?.length || result.rejected?.length) throw Object.assign(new Error("Mail rejected"), { code: "REJECTED" });
    console.info(JSON.stringify({ event: "mail.accepted", kind: mail.type || "link" }));
  } catch (error) {
    const failure = error as { code?: string; responseCode?: number };
    const code = /^[A-Z_]{2,30}$/.test(failure.code || "") ? failure.code : "SEND_FAILED";
    console.error(JSON.stringify({ event: "mail.failed", code, status: failure.responseCode }));
    // Do not let auth logs expose SMTP credentials, recipients, links or codes.
    throw new Error("Xat yuborilmadi. Birozdan keyin qayta urinib ko‘ring.");
  } finally { transport.close(); }
}
export async function sendAuthEmail(to: string, subject: string, url: string) {
  await deliver({ to, subject, url, text: `${subject}\n\n${url}\n\nAgar buni siz so‘ramagan bo‘lsangiz, xatga e’tibor bermang.` });
}
export async function sendAuthCode(to: string, otp: string, type: string) {
  if (!/^\d{6}$/.test(otp)) throw new Error("Invalid authentication code format");
  const reset = type === "forget-password";
  const heading = reset ? "Parolni tiklash / Сброс пароля / Password reset" : "Pochtani tasdiqlash / Подтверждение почты / Verify your email";
  await deliver({
    to, otp, type,
    subject: `FlowKey — ${reset ? "Parolni tiklash kodi / Код сброса пароля" : "Tasdiqlash kodi / Код подтверждения"}`,
    text: `${heading}\n\n${otp}\n\nUshbu 6 xonali kodni FlowKey sahifasiga kiriting. Kod 10 daqiqa amal qiladi.\nВведите этот код на странице FlowKey. Он действителен 10 минут.\nEnter this code on FlowKey. It expires in 10 minutes.\n\nKodni hech kimga bermang. / Никому не сообщайте код. / Do not share this code.\nAgar buni siz so‘ramagan bo‘lsangiz, xatga e’tibor bermang.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#30243f"><h2 style="color:#7024df">FlowKey</h2><p>${heading}</p><div style="font-size:36px;letter-spacing:8px;font-weight:bold;padding:24px;background:#f4edfc;border-radius:16px;text-align:center">${otp}</div><p>Введите код на странице FlowKey. Он действителен 10 минут.</p><p>Ushbu kodni FlowKey sahifasiga kiriting. Kod 10 daqiqa amal qiladi.</p><p>Enter this code on FlowKey. It expires in 10 minutes.</p><p style="font-size:13px;color:#796b86">Никому не сообщайте код. Если вы не запрашивали его, проигнорируйте письмо.</p></div>`,
  });
}
