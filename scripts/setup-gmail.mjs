import nodemailer from "nodemailer";
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";

function hiddenPassword() {
  return new Promise((resolve, reject) => {
    let value = "";
    process.stdout.write("Google App Password (yashirin): ");
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = () => {
      process.stdin.off("keypress", keypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    function keypress(text, key) {
      if (key?.ctrl && key.name === "c") {
        finish();
        reject(new Error("cancelled"));
      } else if (key?.name === "return" || key?.name === "enter") {
        finish();
        resolve(value.replace(/\s/g, ""));
      } else if (key?.name === "backspace") {
        value = value.slice(0, -1);
      } else if (text && !key?.ctrl && !key?.meta) value += text;
    }
    process.stdin.on("keypress", keypress);
  });
}

async function main() {
  if (!process.stdin.isTTY) throw new Error("terminal");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("FlowKey — Gmail orqali tasdiqlash va parol tiklash xatlari");
  console.log("Oddiy Gmail parolini emas, Google App Password’ini kiriting.");
  console.log("https://myaccount.google.com/apppasswords");
  const email = (await rl.question("Xat yuboradigan Gmail manzili: "))
    .trim()
    .toLowerCase();
  rl.close();
  if (!/^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i.test(email))
    throw new Error("email");
  const password = await hiddenPassword();
  if (!/^[a-z0-9]{16}$/i.test(password)) throw new Error("password");
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: email, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    logger: false,
    debug: false,
  });
  try {
    console.log("Gmail ulanishi tekshirilmoqda…");
    await transport.verify();
  } finally {
    transport.close();
  }
  // Do not change the active delivery mode until Gmail authentication succeeds.
  let content = await readFile(".env", "utf8");
  const values = {
    MAIL_TRANSPORT: "smtp",
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "465",
    SMTP_USER: email,
    SMTP_PASSWORD: password,
    MAIL_FROM: `FlowKey <${email}>`,
  };
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${JSON.stringify(value)}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    content = pattern.test(content)
      ? content.replace(pattern, () => line)
      : content.trimEnd() + "\n" + line + "\n";
  }
  const temporary = `.env.gmail-${process.pid}.tmp`;
  try {
    await writeFile(temporary, content, { mode: 0o600, flag: "wx" });
    await rename(temporary, ".env");
  } finally {
    await unlink(temporary).catch(() => {});
  }
  console.log(
    "Gmail tasdiqlandi. Sozlamalar faqat local .env fayliga saqlandi.",
  );
  console.log(
    "Local serverni qayta ishga tushiring, keyin ‘Parolni unutdingizmi?’ orqali xat so‘rang.",
  );
}
main().catch((error) => {
  const messages = {
    terminal:
      "Bu sozlashni interaktiv terminalda ishga tushiring: npm run mail:setup",
    email: "Gmail manzilini to‘g‘ri kiriting.",
    password:
      "Google bergan 16 belgili App Password’ni kiriting. Oddiy Gmail paroli ishlatilmaydi.",
    cancelled: "Sozlash bekor qilindi.",
  };
  console.error(
    messages[error?.message] ||
      "Gmail ulanmadi. App Password, Google 2-Step Verification va internetni tekshiring. Sozlamalar yoqilmadi.",
  );
  process.exitCode = 1;
});
