// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import type { Location, RouteGroup } from '@/types/pricing';
import { adminGetLocations, adminGetRouteGroups } from '@/data/api';

import { RouteGroupAdmin } from './RouteGroupAdmin';

const { mockCapture } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
}));

vi.mock('@/data/api', () => ({
  adminGetLocations: vi.fn(),
  adminGetRouteGroups: vi.fn(),
  adminCreateRouteGroup: vi.fn(),
  adminUpdateRouteGroup: vi.fn(),
  adminDeleteRouteGroup: vi.fn(),
  adminReorderRouteGroups: vi.fn(),
}));

vi.mock('@/hooks/useReorderAnimation', () => ({
  useReorderAnimation: vi.fn(() => ({ ref: { current: null }, capture: mockCapture })),
  useExpandCollapse: vi.fn(() => ({ current: null })),
}));

function makeLocation(id: string, nameAr: string, type: Location['type']): Location {
  return { id, nameAr, name: nameAr, type, displayOrder: 0 };
}

function makeGroup(id: string, from: string[], to: string[]): RouteGroup {
  return {
    id,
    type: 'travel',
    nameAr: 'دمياط إلى القاهرة',
    fromLocations: from,
    toLocations: to,
    bidirectional: true,
    pricing: {
      sedan: { oneWay: 100, roundTrip: 180 },
      suv: { oneWay: 120, roundTrip: 200 },
      family_cruiser: { oneWay: 150, roundTrip: 260 },
      minibus: { oneWay: 180, roundTrip: 300 },
    },
    displayOrder: 0,
  };
}

describe('RouteGroupAdmin location pickers carry no type badge', () => {
  beforeEach(() => {
    mockCapture.mockClear();
    vi.mocked(adminGetRouteGroups).mockReset().mockResolvedValue([]);
    vi.mocked(adminGetLocations)
      .mockReset()
      .mockResolvedValue([
        makeLocation('loc-damietta', 'دمياط', 'internal'),
        makeLocation('loc-cairo', 'القاهرة', 'travel'),
      ]);
  });

  it('renders neither "سفر" nor "داخلي" next to any location option in the from picker', async () => {
    render(<RouteGroupAdmin />);
    const picker = await screen.findByTestId('route-group-from-picker');

    await waitFor(() => expect(picker.querySelectorAll('label')).toHaveLength(2));
    expect(picker.textContent).toContain('دمياط');
    expect(picker.textContent).toContain('القاهرة');
    expect(picker.textContent).not.toContain('سفر');
    expect(picker.textContent).not.toContain('داخلي');
  });

  it('renders neither "سفر" nor "داخلي" next to any location option in the to picker', async () => {
    render(<RouteGroupAdmin />);
    const picker = await screen.findByTestId('route-group-to-picker');

    await waitFor(() => expect(picker.querySelectorAll('label')).toHaveLength(2));
    expect(picker.textContent).toContain('دمياط');
    expect(picker.textContent).toContain('القاهرة');
    expect(picker.textContent).not.toContain('سفر');
    expect(picker.textContent).not.toContain('داخلي');
  });

  it('keeps the group type badge on the existing-route header', async () => {
    vi.mocked(adminGetRouteGroups).mockResolvedValue([makeGroup('rg-1', ['loc-damietta'], ['loc-cairo'])]);
    render(<RouteGroupAdmin />);

    const card = await screen.findByTestId('route-group-card-rg-1');
    expect(card.textContent).toContain('سفر');
  });
});

describe('RouteGroupCard summary arrow points at the target location in RTL', () => {
  beforeEach(() => {
    mockCapture.mockClear();
    vi.mocked(adminGetLocations).mockReset().mockResolvedValue([
      makeLocation('loc-damietta', 'دمياط', 'internal'),
      makeLocation('loc-cairo', 'القاهرة', 'travel'),
    ]);
    vi.mocked(adminGetRouteGroups).mockReset().mockResolvedValue([makeGroup('rg-1', ['loc-damietta'], ['loc-cairo'])]);
  });

  it('separates from and to with a leftwards arrow, never a rightwards one', async () => {
    render(<RouteGroupAdmin />);

    const header = await screen.findByTestId('route-group-expand-rg-1');
    // RTL puts the origin on the right, so the arrow must point left, at the destination.
    expect(header.textContent).toContain('دمياط ← القاهرة');
    expect(header.textContent).not.toContain('→');
  });
});
