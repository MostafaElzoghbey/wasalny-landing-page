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

// The public site renders a full-screen PageLoader overlay (z-[9999]) on every
// full page load for ~3s. It blocks pointer events, so wait for it to detach
// before interacting with anything. This is only needed on the public site
// (e.g. `/`); on `/admin` the loader is a harmless no-op that never renders, so
// calling this there is safe but unnecessary.
async function waitForPageLoader(page: Page): Promise<void> {
  const loader = page.locator('div.z-\\[9999\\]').first();
  await loader.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
  await loader.waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
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
  await page.getByTestId('admin-nav-faqs').click();
  await expect(page.getByTestId('faq-question')).toBeVisible();
  await expect(page.getByTestId('faq-answer')).toBeVisible();
  await expect(page.getByTestId('faq-create-submit')).toBeVisible();

  // f. Create a unique FAQ.
  await page.getByTestId('faq-question').fill(uniqueQuestion);
  await page.getByTestId('faq-answer').fill(answer);
  await page.getByTestId('faq-create-submit').click();

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
  await page.getByTestId('admin-nav-faqs').click();

  const cleanupItem = page.locator('[data-testid="faq-item"]', {
    hasText: uniqueQuestion,
  });
  await expect(cleanupItem).toBeVisible();

  // Two-step in-app confirm: Delete (opens Confirm/Cancel), then Confirm.
  // Use auto-waiting clicks scoped to this item so we never race React's
  // re-render between the two steps.
  await cleanupItem.getByTestId('faq-delete').click();
  await cleanupItem.getByTestId('faq-delete-confirm').click();
  // The confirm button only disappears after handleDelete finishes (API call +
  // list reload), so waiting for it to detach proves we assert the FINAL state —
  // not the brief "Loading…" flash where the row is momentarily unmounted
  // (which would otherwise yield a false pass).
  await expect(cleanupItem.getByTestId('faq-delete-confirm')).toHaveCount(0);
  await expect(cleanupItem).toHaveCount(0);
});
