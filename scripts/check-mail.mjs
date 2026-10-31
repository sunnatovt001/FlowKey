import nodemailer from "nodemailer";
process.loadEnvFile(".env");
let transport;
try {
  if (
    process.env.MAIL_TRANSPORT !== "smtp" ||
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD ||
    !process.env.MAIL_FROM
  )
    throw new Error("missing");
  const port = Number(process.env.SMTP_PORT || 587);
  if (![465, 587].includes(port)) throw new Error("port");
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    logger: false,
    debug: false,
  });
  await transport.verify();
  console.log(
    "SMTP ulanishi va yuboruvchi hisobi tasdiqlandi. Sinov xati yuborilmadi.",
  );
} catch (error) {
  console.error(
    error?.message === "missing"
      ? "Email yuborish hali sozlanmagan. npm run mail:setup buyrug‘ini ishga tushiring."
      : "SMTP tekshiruvi o‘tmadi. Server, port va App Password’ni tekshiring.",
  );
  process.exitCode = 1;
} finally {
  transport?.close();
}
