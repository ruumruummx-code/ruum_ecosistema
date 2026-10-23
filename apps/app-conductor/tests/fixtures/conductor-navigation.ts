import { expect, type Page } from "@playwright/test";

export function shellNavigation(page: Page) {
  const desktop = page.locator("[data-conductor-header]").getByRole("navigation", { name: "Navegación principal", exact: true });
  const mobile = page.locator("[data-conductor-mobile-nav]").getByRole("navigation", { name: "Navegación principal móvil", exact: true });
  return desktop.or(mobile).filter({ visible: true });
}

export async function expectAccountShellNavigation(page: Page) {
  const navigation = shellNavigation(page);
  await expect(navigation).toHaveCount(1);
  const links = navigation.getByRole("link");
  await expect(links).toHaveCount(5);
  for (const [index, href] of ["/panel", "/viajes", "/ganancias", "/notificaciones", "/cuenta"].entries()) {
    await expect(links.nth(index)).toHaveAttribute("href", href);
  }
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(navigation.locator('[aria-current="page"]')).toHaveAttribute("href", "/cuenta");
  return navigation;
}
