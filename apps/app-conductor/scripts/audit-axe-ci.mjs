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

  // Gate de aserción: fallar el job de CI si hay violaciones críticas o serias
  const criticalViolations = report.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  if (criticalViolations.length > 0) {
    console.error(
      `❌ Axe gate: ${criticalViolations.length} violación(es) crítica(s)/seria(s) detectada(s):`
    );
    for (const v of criticalViolations) {
      console.error(`  - ${v.id}: ${v.description} (${v.impact})`);
    }
    process.exit(1);
  }

  if (report.violations.length > 0) {
    console.warn(
      `⚠️  Axe gate: ${report.violations.length} violación(es) menor(es) detectada(s) (no bloqueante).`
    );
  }
} finally {
  await browser.close();
}
