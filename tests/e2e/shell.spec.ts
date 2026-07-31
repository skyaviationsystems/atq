import { expect, test } from "@playwright/test";

const waitForApp = async (page: import("@playwright/test").Page) => {
    await page.locator('[data-atq-ready="true"]').waitFor();
};

test("loads the ATQ operations workspace and navigates modules", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);
    await expect(page).toHaveURL(/\/operations$/);
    await expect(page.getByRole("banner")).toContainText("Operations");

    const mobileMenuButton = page.getByRole("button", { name: "Open navigation" });
    if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
    }
    await expect(page.getByRole("navigation", { name: "ATQ modules" })).toBeVisible();

    await page.getByRole("link", { name: /Forms/ }).click();
    await expect(page).toHaveURL(/\/forms$/);
    await expect(page.getByRole("banner")).toContainText("Forms");
});

test("opens the global command palette from the keyboard", async ({ page }) => {
    await page.goto("/operations");
    await waitForApp(page);
    await page.keyboard.press("Control+K");
    await expect(page.getByRole("dialog", { name: "Global search and command palette" })).toBeVisible();
    await page.getByPlaceholder(/Search people/).fill("compliance");
    await expect(page.getByRole("link", { name: /Compliance, Audit/ })).toBeVisible();
});

test("numeric deep links select the intended module view", async ({ page }) => {
    await page.goto("/operations/0.1");
    await waitForApp(page);
    await expect(page.getByText("Live domain-engine demonstration")).toBeVisible();
    await expect(page.getByText("Deterministic match")).toBeVisible();

    await page.goto("/records/4.2");
    await expect(page.getByText("Event and form history")).toBeVisible();
});

test("enters local demo mode without collecting credentials", async ({ page }) => {
    await page.goto("/sign-in");
    await waitForApp(page);
    await expect(page.getByRole("button", { name: "Continue to demo" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).not.toHaveAttribute("required");
    await page.getByRole("button", { name: "Continue to demo" }).click();
    await expect(page).toHaveURL(/\/operations$/);
});

test("updates a form rating and exposes the saved state", async ({ page }) => {
    await page.goto("/forms");
    await waitForApp(page);
    const rating = page.getByRole("button", {
        name: "Crew effectiveness: 4 · Strong. Consistently effective with positive margin.",
    });

    await rating.click();
    await expect(rating).toHaveAttribute("aria-pressed", "true");
    const saveLabel = page
        .locator("header")
        .getByText(/Saving|Saved/, { exact: true })
        .first();
    await expect(saveLabel).toHaveText("Saving");
    await expect(saveLabel).toHaveText("Saved");

    await page.reload();
    await expect(rating).toHaveAttribute("aria-pressed", "true");
});
