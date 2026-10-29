import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.FLOWZA_TEST_URL || "http://127.0.0.1:3100",
    trace: "off",
    screenshot: "off",
  },
  reporter: [["list"]],
  outputDir: "output/e2e",
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
