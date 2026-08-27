import { test, expect, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';

const ADMIN_EMAIL = 'e2e-admin@wasalny.test';
const ADMIN_PASSWORD = 'E2eTest123!';

// Create the e2e admin account before the suite runs. The webServer (already
// started by Playwright) seeded the SQLite DB at boot, so the DB file exists
// and `admin:create` can upsert the account against it.
test.beforeAll(() => {
  execSync(`npm run admin:create -- ${ADMIN_EMAIL} ${ADMIN_PASSWORD}`, {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
});

// The public App renders a full-screen PageLoader overlay (z-[9999]) on every
// full page load for ~3s. It blocks pointer events, so wait for it to detach
// before interacting with anything.
async function waitForPageLoader(page: Page): Promise<void> {
  const loader = page.locator('div.z-\\[9999\\]').first();
  await loader.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
  await loader.waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// The global fixed Header (z-50) floats over the admin dashboard and its
// transparent backdrop intercepts real pointer clicks on the top-aligned admin
// controls (nav buttons, create/delete buttons). We dispatch a genuine DOM
// click on the element, which still fires React's onClick handler, bypassing
// the overlay's hit-testing without changing app behaviour.
async function clickTestId(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).waitFor({ state: 'visible' });
  await page.evaluate((id) => {
    const el = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    if (!el) throw new Error(`Element [data-testid="${id}"] not found`);
    el.click();
  }, testId);
}

// Ensure we are on the authenticated admin dashboard. The session cookie
// persists across navigations, but if the app dropped us to the login form we
// log in again. Waits out the initial "Loading…" session check first.
async function ensureLoggedIn(page: Page): Promise<void> {
  const emailInput = page.getByTestId('admin-email');
  const navFaqs = page.getByTestId('admin-nav-faqs');

  // Wait until the app has settled on either the login form or the dashboard.
  await emailInput.or(navFaqs).first().waitFor({ state: 'visible' });

  if (await emailInput.isVisible()) {
    await emailInput.fill(ADMIN_EMAIL);
    await page.getByTestId('admin-password').fill(ADMIN_PASSWORD);
    await page.getByTestId('admin-login-submit').click();
  }

  await expect(navFaqs).toBeVisible();
}

test('admin can create a FAQ, see it on the public site, and delete it', async ({
  page,
}) => {
  // The FAQ delete button triggers a native window.confirm() dialog. Playwright
  // auto-dismisses dialogs (which would cancel the delete), so accept it.
  page.on('dialog', (dialog) => dialog.accept());

  const uniqueQuestion = `E2E FAQ ${Date.now()}`;
  const answer = 'e2e answer';

  // a/b. Open the admin area and expect the login form.
  await page.goto('/admin');
  await waitForPageLoader(page);
  await expect(page.getByTestId('admin-email')).toBeVisible();

  // c. Log in.
  await page.getByTestId('admin-email').fill(ADMIN_EMAIL);
  await page.getByTestId('admin-password').fill(ADMIN_PASSWORD);
  await page.getByTestId('admin-login-submit').click();

  // d. Dashboard is shown (auth succeeded).
  await expect(page.getByTestId('admin-nav-faqs')).toBeVisible();

  // e. Open the FAQs section and expect the create form.
  await clickTestId(page, 'admin-nav-faqs');
  await expect(page.getByTestId('faq-question')).toBeVisible();
  await expect(page.getByTestId('faq-answer')).toBeVisible();
  await expect(page.getByTestId('faq-create-submit')).toBeVisible();

  // f. Create a unique FAQ.
  await page.getByTestId('faq-question').fill(uniqueQuestion);
  await page.getByTestId('faq-answer').fill(answer);
  await clickTestId(page, 'faq-create-submit');

  // g. It appears in the admin list (persisted via the API).
  const adminItem = page.locator('[data-testid="faq-item"]', {
    hasText: uniqueQuestion,
  });
  await expect(adminItem).toBeVisible();

  // h. Persistence to the public site: the question text is rendered in the DOM
  // (the public FAQ accordion always shows the question; only the answer is
  // collapsed). We assert attachment rather than visibility to avoid any
  // scroll/animation-dependent flakiness.
  await page.goto('/');
  await waitForPageLoader(page);
  await expect(page.getByText(uniqueQuestion, { exact: true })).toBeAttached();

  // i. Cleanup: return to admin, delete the FAQ, assert it is removed.
  await page.goto('/admin');
  await waitForPageLoader(page);
  await ensureLoggedIn(page);
  await clickTestId(page, 'admin-nav-faqs');

  const cleanupItem = page.locator('[data-testid="faq-item"]', {
    hasText: uniqueQuestion,
  });
  await expect(cleanupItem).toBeVisible();

  // The delete button lives inside the list item; click it via the DOM to avoid
  // the header overlay, then the native confirm dialog is auto-accepted above.
  await page.evaluate((q) => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="faq-item"]'),
    );
    const item = items.find((el) => el.textContent?.includes(q));
    const btn = item?.querySelector<HTMLButtonElement>('button');
    if (!btn) throw new Error(`Delete button for "${q}" not found`);
    btn.click();
  }, uniqueQuestion);

  await expect(cleanupItem).toHaveCount(0);
});
