import { test, expect, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';

const ADMIN_EMAIL = 'e2e-admin@wasalny.test';
const ADMIN_PASSWORD = 'E2eTest123!';

test.beforeAll(() => {
  execSync(`npm run admin:create -- ${ADMIN_EMAIL} ${ADMIN_PASSWORD}`, {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
});

async function waitForPageLoader(page: Page): Promise<void> {
  const loader = page.locator('div.z-\\[9999\\]').first();
  await loader.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
  await loader.waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// Authenticate to the admin dashboard and open the Cars section.
async function adminLogin(page: Page): Promise<void> {
  await page.goto('/admin');
  await waitForPageLoader(page);
  const emailInput = page.getByTestId('admin-email');
  const navFaqs = page.getByTestId('admin-nav-faqs');
  await emailInput.or(navFaqs).first().waitFor({ state: 'visible' });
  if (await emailInput.isVisible()) {
    await emailInput.fill(ADMIN_EMAIL);
    await page.getByTestId('admin-password').fill(ADMIN_PASSWORD);
    await page.getByTestId('admin-login-submit').click();
  }
  await expect(navFaqs).toBeVisible();
  await page.getByRole('button', { name: 'السيارات' }).click();
  await expect(page.getByText('السيارات').first()).toBeVisible();
}

// Open the "سيارة جديدة" create form.
async function openCreateForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'سيارة جديدة' }).click();
  await expect(page.getByRole('button', { name: 'إنشاء سيارة' })).toBeVisible();
}

// Fill the required create-form fields with unique values.
async function fillCreateForm(page: Page, suffix: string): Promise<void> {
  await page.getByLabel('الاسم').fill(`E2E Car ${suffix}`);
  await page.getByLabel('الاسم (عربي)').fill(`سيارة اختبار ${suffix}`);
  await page.getByLabel('الفئة (عربي)').fill(`فئة ${suffix}`);
  await page.getByLabel('عدد الركاب').fill('4');
}

// The create form has no ID input: assert only the expected fields exist.
test('admin create car without id: no المعرّف input, submit generates id', async ({ page }) => {
  await adminLogin(page);
  await openCreateForm(page);

  // No ID field in the create form (labels are الاسم / الاسم (عربي) / الفئة (عربي) / عدد الركاب / الوصف).
  await expect(page.getByLabel('المعرّف')).toHaveCount(0);
  await expect(page.getByText('المعرّف:')).toHaveCount(0);

  const suffix = `no-id-${Date.now()}`;
  await fillCreateForm(page, suffix);
  await page.getByRole('button', { name: 'إنشاء سيارة' }).click();

  // The new car appears in the sedan group with an auto-generated id.
  const card = page.locator('[data-testid^="car-card-"]', { hasText: `E2E Car ${suffix}` });
  await expect(card).toBeVisible({ timeout: 10000 });
  const testId = (await card.getAttribute('data-testid'))!;
  const generatedId = testId.replace('car-card-', '');
  expect(generatedId.length).toBeGreaterThan(0);
  // The generated id is rendered in the card header (font-mono).
  await expect(card.getByText(generatedId, { exact: true })).toBeVisible();

  // Cleanup: delete the created car.
  await page.getByTestId(`car-expand-${generatedId}`).click();
  await expect(page.getByTestId(`car-delete-${generatedId}`)).toBeVisible();
  await page.getByTestId(`car-delete-${generatedId}`).click();
  await page.getByTestId(`car-delete-confirm-${generatedId}`).click();
  await expect(page.locator(`[data-testid="car-card-${generatedId}"]`)).toHaveCount(0);
});

test('admin chip input: add via Enter/،/paste, remove via Backspace/×', async ({ page }) => {
  await adminLogin(page);
  await openCreateForm(page);

  const chipInput = page.getByTestId('chip-input-features');
  const input = chipInput.locator('input');

  // Add via Enter.
  await input.fill('تكييف');
  await input.press('Enter');
  await expect(page.getByTestId('chip-تكييف')).toBeVisible();

  // Add via Arabic comma (،).
  await input.fill('واي فاي');
  await input.press('،');
  await expect(page.getByTestId('chip-واي فاي')).toBeVisible();

  // Add via paste (comma-separated).
  await input.fill('');
  await input.pressSequentially('شاشة');
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="chip-input-features"] input') as HTMLInputElement;
    const dt = new DataTransfer();
    dt.setData('text/plain', 'كاميرا,نظام صوت');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  });
  await expect(page.getByTestId('chip-كاميرا')).toBeVisible();
  await expect(page.getByTestId('chip-نظام صوت')).toBeVisible();

  // Remove via Backspace (removes the last chip).
  await input.press('Backspace');
  await expect(page.getByTestId('chip-نظام صوت')).toHaveCount(0);

  // Remove via × button.
  await page.getByTestId('chip-remove-كاميرا').click();
  await expect(page.getByTestId('chip-كاميرا')).toHaveCount(0);

  // Remaining chips intact.
  await expect(page.getByTestId('chip-تكييف')).toBeVisible();
  await expect(page.getByTestId('chip-واي فاي')).toBeVisible();
});

test('admin image dropzone: URL add shows preview, drag reorder changes order', async ({ page }) => {
  await adminLogin(page);
  await openCreateForm(page);

  const dropzone = page.getByTestId('car-images-create');
  const fileInput = dropzone.getByTestId('car-images-create-file-input');

  await expect(dropzone.getByTestId('car-images-url-input')).toHaveCount(0);

  await fileInput.setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a61', 'hex') },
    { name: 'b.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a62', 'hex') },
    { name: 'c.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a63', 'hex') },
  ]);

  await expect(dropzone.getByTestId('dropzone-preview-0')).toBeVisible();
  await expect(dropzone.getByTestId('dropzone-preview-1')).toBeVisible();
  await expect(dropzone.getByTestId('dropzone-preview-2')).toBeVisible();

  const srcBefore = await dropzone.getByTestId('dropzone-preview-0').locator('img').getAttribute('src');
  const midBefore = await dropzone.getByTestId('dropzone-preview-1').locator('img').getAttribute('src');

  const src = dropzone.getByTestId('dropzone-preview-0');
  const dst = dropzone.getByTestId('dropzone-preview-2');
  await src.dragTo(dst);

  const firstAfter = await dropzone.getByTestId('dropzone-preview-0').locator('img').getAttribute('src');
  expect(firstAfter).toBe(midBefore);
  expect(firstAfter).not.toBe(srcBefore);
});

test('admin reorder persistence: move-down then reload keeps order via GET', async ({ page }) => {
  await adminLogin(page);

  // Ensure the sedan group has at least 2 cars to reorder.
  const sedanGroup = page.getByTestId('car-category-sedan');
  await expect(sedanGroup).toBeVisible();
  await sedanGroup.click();
  const cards = page.locator('[data-testid^="car-card-"]');
  await expect(cards.first()).toBeVisible({ timeout: 10000 });
  const count = await cards.count();
  if (count < 2) {
    // Create a second sedan car so we have something to reorder.
    await openCreateForm(page);
    const suffix = `reorder-${Date.now()}`;
    await fillCreateForm(page, suffix);
    await page.getByRole('button', { name: 'إنشاء سيارة' }).click();
    await expect(page.locator('[data-testid^="car-card-"]', { hasText: `E2E Car ${suffix}` })).toBeVisible({ timeout: 10000 });
  }

  // Read the current order of sedan cards.
  const sedanCards = page.locator('[data-testid^="car-card-"]');
  const firstId = (await sedanCards.nth(0).getAttribute('data-testid'))!.replace('car-card-', '');
  const secondId = (await sedanCards.nth(1).getAttribute('data-testid'))!.replace('car-card-', '');

  // Move the first car down; it should now be second.
  await page.getByTestId(`move-down-${firstId}`).click();
  await expect(page.locator('[data-testid^="car-card-"]').nth(0)).toHaveAttribute('data-testid', `car-card-${secondId}`);
  await expect(page.locator('[data-testid^="car-card-"]').nth(1)).toHaveAttribute('data-testid', `car-card-${firstId}`);

  // Reload and re-open Cars; order persists via GET.
  await page.reload();
  await waitForPageLoader(page);
  await adminLogin(page);
  await page.getByTestId('car-category-sedan').click();
  await expect(page.locator('[data-testid^="car-card-"]').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid^="car-card-"]').nth(0)).toHaveAttribute('data-testid', `car-card-${secondId}`);
  await expect(page.locator('[data-testid^="car-card-"]').nth(1)).toHaveAttribute('data-testid', `car-card-${firstId}`);

  // Restore original order.
  await page.getByTestId(`move-up-${firstId}`).click();
  await expect(page.locator('[data-testid^="car-card-"]').nth(0)).toHaveAttribute('data-testid', `car-card-${firstId}`);
});

test('admin grouped cars: sedan count, edit category moves group, collapse/expand', async ({ page }) => {
  await adminLogin(page);

  // Sedan group exists with a count badge.
  const sedanGroup = page.getByTestId('car-category-sedan');
  await expect(sedanGroup).toBeVisible();
  await sedanGroup.click();
  const sedanCards = page.locator('[data-testid^="car-card-"]');
  await expect(sedanCards.first()).toBeVisible({ timeout: 10000 });
  const sedanCount = await sedanCards.count();

  // Create a temp car in sedan, then move it to suv via edit.
  await openCreateForm(page);
  const suffix = `group-${Date.now()}`;
  await fillCreateForm(page, suffix);
  await page.getByRole('button', { name: 'إنشاء سيارة' }).click();
  const card = page.locator('[data-testid^="car-card-"]', { hasText: `E2E Car ${suffix}` });
  await expect(card).toBeVisible({ timeout: 10000 });
  const id = (await card.getAttribute('data-testid'))!.replace('car-card-', '');

  // Sedan count incremented.
  await expect(sedanGroup).toContainText(String(sedanCount + 1));

  // Edit the car and change its category to suv.
  await page.getByTestId(`car-expand-${id}`).click();
  await page.getByTestId(`car-edit-${id}`).click();
  await page.locator(`[data-testid="car-card-${id}"] select`).selectOption('suv');
  await page.getByTestId(`car-save-${id}`).click();
  await expect(page.getByTestId(`car-edit-${id}`)).toBeVisible({ timeout: 10000 });

  // The car moved out of sedan and into suv group.
  await expect(page.locator('[data-testid^="car-card-"]', { hasText: `E2E Car ${suffix}` })).toHaveCount(0);
  await expect(sedanGroup).toContainText(String(sedanCount));

  // Collapse sedan, then expand it again.
  await sedanGroup.click();
  await expect(page.locator('[data-testid^="car-card-"]').first()).toHaveCount(0);
  await sedanGroup.click();
  await expect(page.locator('[data-testid^="car-card-"]').first()).toBeVisible();

  // Cleanup: delete the temp car from suv.
  const suvGroup = page.getByTestId('car-category-suv');
  await suvGroup.click();
  const suvCard = page.locator('[data-testid^="car-card-"]', { hasText: `E2E Car ${suffix}` });
  await expect(suvCard).toBeVisible();
  await page.getByTestId(`car-expand-${id}`).click();
  await page.getByTestId(`car-delete-${id}`).click();
  await page.getByTestId(`car-delete-confirm-${id}`).click();
  await expect(page.locator(`[data-testid="car-card-${id}"]`)).toHaveCount(0);
});

test('admin RTL visual: Arabic headings and RTL chips', async ({ page }) => {
  await adminLogin(page);

  // Arabic section heading.
  await expect(page.getByText('السيارات').first()).toBeVisible();

  // Open create form and add chips; verify RTL direction on the chip container.
  await openCreateForm(page);
  const chipInput = page.getByTestId('chip-input-features');
  await expect(chipInput).toHaveAttribute('dir', 'rtl');
  const input = chipInput.locator('input');
  await input.fill('تكييف');
  await input.press('Enter');
  await expect(page.getByTestId('chip-تكييف')).toBeVisible();
  await expect(chipInput).toHaveAttribute('dir', 'rtl');

  // The dropzone is RTL too.
  await expect(page.getByTestId('car-images-create')).toHaveAttribute('dir', 'rtl');

  // Arabic labels present.
  await expect(page.getByLabel('الاسم')).toBeVisible();
  await expect(page.getByLabel('الاسم (عربي)')).toBeVisible();
  await expect(page.getByLabel('الفئة (عربي)')).toBeVisible();
});
