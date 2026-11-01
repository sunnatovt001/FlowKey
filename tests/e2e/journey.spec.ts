import { test, expect } from "@playwright/test";
import { verificationUrl } from "../helpers";
test("verified browser journey, keys, payments, settings and responsive layouts", async ({
  page,
}) => {
  test.setTimeout(180000);
  const clientErrors: string[] = [];
  page.on("pageerror", (error) => clientErrors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Content Security Policy|Refused to execute|hydration/i.test(
        message.text(),
      )
    )
      clientErrors.push(message.text());
  });
  const email = `browser-${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Elektron pochta manzili", { exact: true }).fill(email);
  await page
    .getByLabel("Parol", { exact: true })
    .fill("browser-journey-password-123");
  const signupResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/sign-up/email") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Hisob yaratish" }).click();
  const signup = await signupResponse;
  expect(signup.status(), await signup.text()).toBe(200);
  await expect(
    page.getByText("Davom etishdan oldin elektron pochtangizni tasdiqlang."),
  ).toBeVisible();
  await page.goto(await verificationUrl(email));
  await expect(page).toHaveURL(/onboarding/);
  await page
    .getByLabel("Mahsulot nomi", { exact: true })
    .fill("Browser business");
  await page
    .getByRole("button", { name: "Kabinetga kirish", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hozircha o‘tkazib yuborish" })
    .click();
  await page.getByLabel("Loyiha nomi", { exact: true }).fill("Browser project");
  await page
    .getByRole("button", { name: "Loyiha yaratish", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Loyiha tayyor. API kalitingiz" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Umumiy ko‘rinish", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Umumiy ko‘rinish", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ulash", exact: true }).click();
  await page.getByRole("button", { name: /^API kaliti/ }).click();
  await page
    .getByRole("button", { name: "Kalit yaratish", exact: true })
    .click();
  const keyInput = page.getByLabel(/Kalit nomi/i);
  await expect(keyInput).toBeVisible();
  await keyInput.fill("Browser key");
  await page
    .getByRole("button", { name: "Sinov kaliti yaratish", exact: true })
    .click();
  await expect(page.getByText(/Saqlab oling:.*faqat bir marta/)).toBeVisible();
  await page.getByRole("link", { name: "Unit", exact: true }).click();
  await page.getByLabel(/Sinov summasi/i).fill("125000");
  await page.getByRole("button", { name: /Sinov to‘lovi yaratish/i }).click();
  await expect(page.getByText(/"livemode": false/)).toBeVisible();
  await page.getByRole("link", { name: "Tranzaksiyalar", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("heading", { name: "Tranzaksiyalar", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("link", { name: "Hisob sozlamalari", exact: true })
    .first()
    .click();
  await page.getByLabel("Nomi", { exact: true }).fill("Browser developer");
  const savedProfile = page.waitForResponse(
    (response) => response.url().endsWith("/api/settings/profile") &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Profilni saqlash" }).click();
  const saved = await savedProfile;
  expect(saved.status(), await saved.text()).toBe(200);
  await expect(page.getByText("Muvaffaqiyatli saqlandi.")).toBeVisible({ timeout: 30000 });
  for (const route of [
    "/dashboard",
    "/developers?tab=sandbox",
    "/developers?tab=webhooks",
    "/settings",
    "/docs",
    "/",
  ]) {
    await page.goto(route);
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}`,
      ).toBeTruthy();
    }
  }
  expect(clientErrors).toEqual([]);
});
