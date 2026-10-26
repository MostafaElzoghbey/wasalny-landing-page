// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminApp } from './AdminApp';
import { fetchAdminMe } from '@/data/api';

vi.mock('@/data/api', () => ({
  fetchAdminMe: vi.fn(),
  adminLogin: vi.fn(),
  adminLogout: vi.fn(),
}));

vi.mock('./FaqAdmin', () => ({ FaqAdmin: () => <div data-testid="section-faqs" /> }));
vi.mock('./CarAdmin', () => ({ CarAdmin: () => <div data-testid="section-cars" /> }));
vi.mock('./RouteDataAdmin', () => ({ RouteDataAdmin: () => <div data-testid="section-routeData" /> }));
vi.mock('./LocationAdmin', () => ({ LocationAdmin: () => <div data-testid="section-locations" /> }));
vi.mock('./RouteGroupAdmin', () => ({ RouteGroupAdmin: () => <div data-testid="section-routeGroups" /> }));
vi.mock('./PricingConfigAdmin', () => ({ PricingConfigAdmin: () => <div data-testid="section-pricingConfig" /> }));
vi.mock('./ContentAdmin', () => ({ ContentAdmin: () => <div data-testid="section-content" /> }));

const mockedFetchMe = vi.mocked(fetchAdminMe);
const SECTION_KEY = 'wasalny-admin-section';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mockedFetchMe.mockResolvedValue({ email: 'admin@gmail.com' } as never);
});

describe('AdminApp section memory', () => {
  it('opens on cars when nothing is stored', async () => {
    render(<AdminApp />);
    await waitFor(() => expect(screen.getByTestId('section-cars')).toBeInTheDocument());
    expect(screen.queryByTestId('section-faqs')).toBeNull();
  });

  it('restores the stored section on load', async () => {
    window.localStorage.setItem(SECTION_KEY, 'faqs');
    render(<AdminApp />);
    await waitFor(() => expect(screen.getByTestId('section-faqs')).toBeInTheDocument());
    expect(screen.queryByTestId('section-cars')).toBeNull();
  });

  it('falls back to cars for an unknown stored value', async () => {
    window.localStorage.setItem(SECTION_KEY, 'nope');
    render(<AdminApp />);
    await waitFor(() => expect(screen.getByTestId('section-cars')).toBeInTheDocument());
  });

  it('persists section switches across remounts', async () => {
    const { unmount } = render(<AdminApp />);
    await waitFor(() => expect(screen.getByTestId('section-cars')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('admin-nav-locations'));
    await waitFor(() => expect(screen.getByTestId('section-locations')).toBeInTheDocument());
    expect(window.localStorage.getItem(SECTION_KEY)).toBe('locations');
    unmount();
    render(<AdminApp />);
    await waitFor(() => expect(screen.getByTestId('section-locations')).toBeInTheDocument());
  });
});
