import { emailOTP } from "better-auth/plugins/email-otp";
import { oneTap } from "better-auth/plugins/one-tap";
import { telegramLoginPlugin } from "./telegram-login-plugin";
import { authTrustedOrigins } from "./origins";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { sendAuthEmail, sendAuthCode } from "./email";
import { socialAuthConfiguration } from "./social-auth";

export const auth = betterAuth({
  plugins: [telegramLoginPlugin(), oneTap(), emailOTP({
    otpLength: 6,
    expiresIn: 600,
    allowedAttempts: 5,
    storeOTP: "hashed",
    rateLimit: { window: 60, max: 10 },
    disableSignUp: true,
    overrideDefaultEmailVerification: true,
    sendVerificationOTP: async ({ email, otp, type }) => sendAuthCode(email, otp, type),
  })],
  database: prismaAdapter(db, { provider: "postgresql" }),
  baseURL: process.env.APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: socialAuthConfiguration(),
  account: {
    encryptOAuthTokens: true,
    accountLinking: { enabled: true, allowDifferentEmails: false },
  },
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
    onExistingUserSignUp: async ({ user }): Promise<void> => {
      // Repeated registration must not silently drop the verification email.
      await auth.api.sendVerificationOTP({ body: { email: user.email, type: "email-verification" } });
    },
    sendResetPassword: async ({ user, url }) =>
      sendAuthEmail(user.email, "FlowKey parolingizni tiklash", url),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

  },
  session: { expiresIn: 7 * 86400, cookieCache: { enabled: false } },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "authRateLimit",
    window: 60,
    max: 60,
    customRules: {
      "/telegram/status": { window: 60, max: 1000 },
      "/telegram/complete": { window: 60, max: 120 },
      "/telegram/resume": { window: 60, max: 120 },
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 10 },
      "/request-password-reset": { window: 60, max: 5 },
      "/send-verification-email": { window: 60, max: 5 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/email-otp/request-password-reset": { window: 60, max: 3 },
    },
  },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
});
