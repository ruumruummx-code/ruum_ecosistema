import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const targetUrl = process.argv[2] ?? "http://localhost:3001";
const outputPath = resolve(process.cwd(), process.argv[3] ?? "results/axe-report.json");

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator("#contenido-principal").waitFor({
    state: "visible",
    timeout: 20_000,
  });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 20_000 });

  const report = await new AxeBuilder({ page }).analyze();
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Axe audit completed for ${page.url()}`);
  console.log(`Report saved to ${outputPath}`);
  console.log(`Violations: ${report.violations.length}`);
} finally {
  await browser.close();
}
