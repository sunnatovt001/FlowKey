import {
  test,
  expect as baseExpect,
  type BrowserContext,
} from "@playwright/test";
import { verificationUrl } from "../helpers";
import { randomUUID } from "node:crypto";
const expect = baseExpect.configure({ timeout: 30000 });
test.use({ actionTimeout: 30000 });
test.setTimeout(300000);

test("finance, subscriptions, invitations, role isolation and responsive screens", async ({
  page,
  context,
  browser,
  baseURL,
}) => {
  const origin = baseURL!;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function account(ctx: BrowserContext, label: string) {
    const email = `operations-${label}-${randomUUID()}@example.com`;
    const password = "operations-test-password-123";
    let response = await ctx.request.post(`${origin}/api/auth/sign-up/email`, {
      headers: { Origin: origin },
      data: { email, password, name: "Operations test" },
    });
    expect(response.status(), await response.text()).toBe(200);
    await ctx.request.get(await verificationUrl(email));
    response = await ctx.request.post(`${origin}/api/auth/sign-in/email`, {
      headers: { Origin: origin },
      data: { email, password },
    });
    expect(response.status(), await response.text()).toBe(200);
    return email;
  }
  async function post(path: string, data: unknown, ctx = context) {
    return ctx.request.post(`${origin}${path}`, {
      headers: { Origin: origin, "Idempotency-Key": randomUUID() },
      data,
    });
  }
  await account(context, "owner");
  expect(
    (
      await post("/api/onboarding", {
        businessName: "Operations sandbox",
        businessType: "Startup",
      })
    ).status(),
  ).toBe(200);
  const created = await post("/api/projects", {
    projectName: "Operations test",
  });
  expect(created.status()).toBe(200);
  const project = await created.json();
  expect(
    (
      await post(`/api/projects/${project.id}/payments`, {
        amount_minor: 10000000,
        currency: "UZS",
        result: "successful",
      })
    ).status(),
  ).toBe(200);
  const url = (path: string) => `${origin}${path}?project=${project.id}`;
  await page.goto(url("/finance"));
  await expect(
    page.getByRole("heading", { name: "Mablag‘lar hisobi." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hozircha o‘tkazib yuborish" })
    .click();
  const payout = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Pul chiqarish arizasi",
      exact: true,
    }),
  });
  await payout.getByLabel("Summa, UZS", { exact: true }).fill("20000");
  await payout.getByRole("button", { name: "Sinov arizasi yaratish" }).click();
  await expect(
    page.getByRole("cell", { name: "Tasdiq kutilmoqda" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tasdiqlash", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Tasdiqlangan", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sinovda bajarish" }).click();
  await expect(
    page.getByRole("cell", { name: "Bajarilgan (sinov)", exact: true }),
  ).toBeVisible();
  await page.goto(url("/subscriptions"));
  await page.getByLabel("Obuna nomi").fill("Monthly test");
  await page.getByLabel("Summa, UZS", { exact: true }).fill("50000");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Sinov obunasi yaratish" }).click();
  await expect(page.getByRole("cell", { name: /^Monthly test/ })).toBeVisible();
  await page.getByRole("button", { name: "Davrni sinash" }).click();
  await expect(page.getByRole("button", { name: "Davrni sinash" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Bekor qilish", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Bekor qilingan", exact: true }),
  ).toBeVisible();
  const developer = await browser.newContext();
  try {
    const email = await account(developer, "developer");
    await page.goto(url("/team"));
    await page.getByLabel("Elektron pochta", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Taklif yaratish" }).click();
    await expect(
      page.getByRole("cell", { name: email, exact: true }),
    ).toBeVisible();
    const member = await developer.newPage();
    await member.goto(`${origin}/invitations`);
    await member
      .getByRole("button", { name: "Qabul qilish", exact: true })
      .click();
    await expect(
      member.getByRole("button", { name: "Qabul qilish", exact: true }),
    ).toHaveCount(0);
    await member.goto(url("/developers"));
    await expect(
      member.getByRole("link", { name: "Ulash", exact: true }),
    ).toBeVisible();
    expect(
      (
        await post(
          `/api/projects/${project.id}/operations`,
          { action: "payout", amountMinor: 2000000 },
          developer,
        )
      ).status(),
    ).toBe(403);
    expect(
      (
        await post(
          `/api/projects/${project.id}/team`,
          { action: "invite", email: "other@example.com", role: "accountant" },
          developer,
        )
      ).status(),
    ).toBe(403);
  } finally {
    await developer.close();
  }
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/finance", "/subscriptions", "/team", "/activity"]) {
      await page.goto(url(route));
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `output/e2e/operations-${route.slice(1)}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("body")).toBeVisible();
  expect(errors).toEqual([]);
});
