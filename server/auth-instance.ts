import { authTrustedOrigins } from "./origins";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { sendAuthEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  baseURL: process.env.APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: authTrustedOrigins(
    process.env.APP_URL || "http://localhost:3000",
    process.env.NODE_ENV === "development",
  ),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) =>
      sendAuthEmail(user.email, "FlowKey parolingizni tiklash", url),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) =>
      sendAuthEmail(
        user.email,
        "FlowKey elektron pochtangizni tasdiqlash",
        url,
      ),
  },
  session: { expiresIn: 7 * 86400, cookieCache: { enabled: false } },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "authRateLimit",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 10 },
      "/request-password-reset": { window: 60, max: 5 },
      "/send-verification-email": { window: 60, max: 5 },
    },
  },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
});
