import { expect, test } from "@playwright/test";
import axe from "axe-core";

const routes = [
  "/",
  "/actividades/",
  "/revistas/",
  "/asociate/",
  "/cursos/",
  "/agenda/",
  "/institucional/",
];

for (const route of routes) {
  test(`${route} has no critical or serious accessibility violations`, async ({
    page,
  }) => {
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.ok(), `Expected ${route} to load successfully`).toBe(true);

    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => {
      const axeApi = (window as unknown as { axe: typeof axe }).axe;
      const results = await axeApi.run(document);
      return results.violations.filter(
        (violation) =>
          violation.impact === "critical" || violation.impact === "serious",
      );
    });

    expect(violations).toEqual([]);
  });
}
