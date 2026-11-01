import { z } from "zod";
z.config(z.locales.uz());
export const resourceId = z.object({ id: z.string().min(1).max(100) });
export const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(12, "Kamida 12 ta belgi ishlating.").max(128),
});
export const onboarding = z.object({
  businessName: z.string().trim().min(2).max(100),
  businessType: z.enum([
    "Company",
    "Individual",
    "Individual developer",
    "SaaS company",
    "Startup",
    "Online platform",
    "Other",
  ]),
  projectName: z.string().trim().min(2).max(100),
  website: z
    .union([
      z
        .url()
        .max(500)
        .refine((v) => /^https?:/.test(v)),
      z.literal(""),
    ])
    .optional(),
  description: z.string().max(1000).optional(),
});
export const payment = z.object({
  amount_minor: z.number().int().min(1).max(1000000000),
  currency: z.literal("UZS"),
  result: z.enum(["successful", "failed", "pending"]),
});
export const keyName = z.object({ name: z.string().trim().min(2).max(80) });
export const webhook = z.object({
  url: z.url().max(1000),
  events: z
    .array(z.enum(["payment.successful", "payment.failed", "payment.pending"]))
    .min(1)
    .max(3),
});
