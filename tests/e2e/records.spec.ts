import { expect, test } from "@playwright/test";

const waitForApp = async (page: import("@playwright/test").Page) => {
    await page.locator('[data-atq-ready="true"]').waitFor();
};

test("searches a person and opens a complete person-specific record jacket", async ({ page }) => {
    await page.goto("/records");
    await waitForApp(page);

    await expect(page.getByRole("heading", { name: "Records and qualifications" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search by name or employee number" }).fill("Jordan Blake");

    const personRow = page.getByRole("row", { name: /Jordan Blake/ });
    await expect(personRow).toContainText("SYN-ATQ-1002");
    await personRow.click();

    await expect(page).toHaveURL(/\/records\/people\/person-syn-1002$/);
    await expect(page.getByRole("heading", { name: "Jordan Blake" })).toBeVisible();
    await expect(page.getByText("Personal and employment information")).toBeVisible();
    await expect(page.getByText("Operational assignment")).toBeVisible();

    await page.getByRole("tab", { name: "Qualifications" }).click();
    await expect(page.getByRole("table", { name: "Qualifications for Jordan Blake" })).toBeVisible();

    await page.getByRole("tab", { name: "Training records", exact: true }).click();
    await page.getByRole("searchbox", { name: /Search this person.*training records/ }).fill("TASK-B747");
    await expect(page.getByRole("table", { name: "Training records for Jordan Blake" })).toContainText("TASK-B747");

    await page.getByRole("tab", { name: "Currency & credentials" }).click();
    await expect(page.getByRole("table", { name: "Currency requirements for Jordan Blake" })).toContainText("Next planned");
});

test("filters all records by a stable task and drills into its evidence chain", async ({ page }) => {
    await page.goto("/records/explorer");
    await waitForApp(page);

    const taskSelect = page.getByLabel("Task or Vision ID");
    const taskOptionLabel = await taskSelect.locator("option").filter({ hasText: "TASK-B747-RTO-001" }).textContent();
    await taskSelect.selectOption({ label: taskOptionLabel! });
    const recordsTable = page.getByRole("table", { name: "All training records" });
    await expect(recordsTable).toBeVisible();
    await expect(recordsTable.getByText("TASK-B747-RTO-001")).toHaveCount(4);

    await recordsTable.getByRole("button", { name: "View record" }).first().click();
    const drawer = page.getByRole("dialog", { name: /Rejected takeoff|Training record/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("heading", { name: "Evidence chain" })).toBeVisible();
    await expect(drawer).toContainText("Source form");
    await expect(drawer).toContainText("Qualification effect");

    await drawer.getByRole("button", { name: "Open person profile" }).click();
    await expect(page).toHaveURL(/\/records\/people\/person-syn-/);
});

test("deep links to people and explains qualification matrix cells", async ({ page }) => {
    await page.goto("/records/people/person-syn-1005");
    await waitForApp(page);
    await expect(page.getByRole("heading", { name: "Dakota Brooks" })).toBeVisible();

    await page.goto("/records/matrix");
    await waitForApp(page);
    const matrix = page.getByRole("table", { name: "Population qualification matrix" });
    await expect(matrix).toBeVisible();

    const qualificationCell = matrix.locator("tbody td button:not([disabled])").first();
    await qualificationCell.click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("Calculation");
    await expect(drawer).toContainText("Source form");
});

test("global search opens a person profile directly", async ({ page }) => {
    await page.goto("/operations");
    await waitForApp(page);
    await page.keyboard.press("Control+K");
    await page.getByPlaceholder(/Search people/).fill("Avery Morgan");

    const personResult = page.getByRole("link", { name: /Avery Morgan.*Person/ });
    await expect(personResult).toBeVisible();
    await personResult.click();

    await expect(page).toHaveURL(/\/records\/people\/person-syn-1001$/);
    await expect(page.getByRole("heading", { name: "Avery Morgan" })).toBeVisible();
});
