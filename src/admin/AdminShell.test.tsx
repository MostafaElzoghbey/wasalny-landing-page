// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { fetchAdminMe } from '@/data/api';

import { AdminApp } from './AdminApp';

vi.mock('@/data/api', () => ({
  fetchAdminMe: vi.fn(),
  adminLogin: vi.fn(),
  adminLogout: vi.fn(),
}));

vi.mock('./CarAdmin', () => ({ CarAdmin: () => <div data-testid="section-cars" /> }));
vi.mock('./LocationAdmin', () => ({ LocationAdmin: () => <div data-testid="section-locations" /> }));
vi.mock('./RouteGroupAdmin', () => ({ RouteGroupAdmin: () => <div data-testid="section-routeGroups" /> }));
vi.mock('./RouteDataAdmin', () => ({ RouteDataAdmin: () => <div data-testid="section-routeData" /> }));
vi.mock('./PricingConfigAdmin', () => ({ PricingConfigAdmin: () => <div data-testid="section-pricingConfig" /> }));
vi.mock('./FaqAdmin', () => ({ FaqAdmin: () => <div data-testid="section-faqs" /> }));
vi.mock('./ContentAdmin', () => ({ ContentAdmin: () => <div data-testid="section-content" /> }));
vi.mock('./IdentityAdmin', () => ({ IdentityAdmin: () => <div data-testid="section-identity" /> }));

const SECTION_KEYS = [
  'cars',
  'identity',
  'locations',
  'routeGroups',
  'routeData',
  'pricingConfig',
  'faqs',
  'content',
] as const;

const SECTION_KEY = 'wasalny-admin-section';

const mockedFetchMe = vi.mocked(fetchAdminMe);

const realMatchMedia = window.matchMedia;

function stubViewport(desktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: desktop,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

async function renderAdmin() {
  render(<AdminApp />);
  await waitFor(() => expect(screen.getByTestId('section-cars')).toBeInTheDocument());
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.matchMedia = realMatchMedia;
  mockedFetchMe.mockResolvedValue({ email: 'admin@gmail.com' } as never);
});

describe('AdminApp mobile shell', () => {
  it('exposes every section nav control exactly once', async () => {
    await renderAdmin();

    for (const key of SECTION_KEYS) {
      expect(screen.getAllByTestId(`admin-nav-${key}`)).toHaveLength(1);
    }
  });

  it('keeps the drawer inert and hidden from assistive tech while collapsed', async () => {
    await renderAdmin();

    const drawer = screen.getByTestId('admin-drawer');
    expect(drawer).toHaveAttribute('inert');
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes the drawer once expanded', async () => {
    await renderAdmin();

    fireEvent.click(screen.getByTestId('admin-menu-button'));

    const drawer = screen.getByTestId('admin-drawer');
    expect(drawer).not.toHaveAttribute('inert');
    expect(drawer).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('reports the toggle state through aria-expanded and aria-controls', async () => {
    await renderAdmin();

    const toggle = screen.getByTestId('admin-menu-button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'admin-drawer');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('locks body scroll while expanded and restores it on close', async () => {
    await renderAdmin();

    const toggle = screen.getByTestId('admin-menu-button');

    fireEvent.click(toggle);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(toggle);
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on Escape and returns focus to the toggle', async () => {
    await renderAdmin();

    const toggle = screen.getByTestId('admin-menu-button');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(toggle);
  });

  it('closes when the backdrop is tapped', async () => {
    await renderAdmin();

    const toggle = screen.getByTestId('admin-menu-button');
    fireEvent.click(toggle);

    fireEvent.click(screen.getByTestId('admin-drawer-backdrop'));

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('switches section, closes the drawer and persists the choice', async () => {
    await renderAdmin();

    const toggle = screen.getByTestId('admin-menu-button');
    fireEvent.click(toggle);
    fireEvent.click(screen.getByTestId('admin-nav-faqs'));

    await waitFor(() => expect(screen.getByTestId('section-faqs')).toBeInTheDocument());
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(window.localStorage.getItem(SECTION_KEY)).toBe('faqs');
  });

  it('marks the active section with aria-current for assistive tech', async () => {
    await renderAdmin();

    await waitFor(() =>
      expect(screen.getByTestId('admin-nav-cars')).toHaveAttribute('aria-current', 'page'),
    );
    expect(screen.getByTestId('admin-nav-faqs')).not.toHaveAttribute('aria-current');
  });

  it('keeps logout reachable from inside the drawer', async () => {
    await renderAdmin();

    fireEvent.click(screen.getByTestId('admin-menu-button'));

    expect(screen.getByTestId('admin-logout')).toBeInTheDocument();
  });

  it('gives the drawer toggle a 44px touch target', async () => {
    await renderAdmin();

    expect(screen.getByTestId('admin-menu-button')).toHaveClass('min-h-[44px]');
  });

  it('leaves the nav reachable by assistive tech on desktop, where it is always visible', async () => {
    stubViewport(true);
    await renderAdmin();

    const drawer = screen.getByTestId('admin-drawer');
    expect(drawer).not.toHaveAttribute('inert');
    expect(drawer).not.toHaveAttribute('aria-hidden');
  });

  it('keeps the nav reachable on desktop even before the drawer is ever opened', async () => {
    stubViewport(true);
    await renderAdmin();

    expect(screen.getByTestId('admin-nav-cars').closest('[aria-hidden="true"]')).toBeNull();
  });

  // jsdom cannot evaluate the cascade, so this asserts the SHAPE of the fix rather
  // than the rendered result. The real guard is the browser audit, which asserts the
  // sidebar's bounding box is on screen and that a nav button is hit-testable.
  it('scopes the off-canvas offset to max-lg so rtl: cannot beat lg:', async () => {
    await renderAdmin();

    const collapsed = screen.getByTestId('admin-drawer').className;
    expect(collapsed).toContain('max-lg:-translate-x-full');
    expect(collapsed).toContain('max-lg:rtl:translate-x-full');
    expect(collapsed).not.toMatch(/(^|\s)-translate-x-full(\s|$)/);
    expect(collapsed).not.toMatch(/(^|\s)rtl:translate-x-full(\s|$)/);
    expect(collapsed).not.toContain('lg:translate-x-0');
  });
});
