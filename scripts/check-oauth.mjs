import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
const base = new URL(process.env.APP_URL || "http://localhost:3000").origin;
for (const provider of ["google", "github"]) {
  const prefix = provider.toUpperCase();
  const ready = !!(
    process.env[prefix + "_CLIENT_ID"]?.trim() &&
    process.env[prefix + "_CLIENT_SECRET"]?.trim()
  );
  console.log(
    provider +
      ": " +
      (ready
        ? "kalitlar kiritilgan"
        : "Client ID va Client Secret kiritilmagan"),
  );
  console.log("Callback: " + base + "/api/auth/callback/" + provider);
}
console.log(
  "Kalitlar mavjudligi tekshirildi. Provayderdagi callback sozlamasi va haqiqiy kirishni alohida tekshiring.",
);
