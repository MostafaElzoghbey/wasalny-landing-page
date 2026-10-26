// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { adminCreateLocation, adminGetLocations } from '@/data/api';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';

import { LocationAdmin } from './LocationAdmin';

const { mockCapture } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
}));

vi.mock('@/data/api', () => ({
  adminGetLocations: vi.fn(),
  adminCreateLocation: vi.fn(),
  adminUpdateLocation: vi.fn(),
  adminDeleteLocation: vi.fn(),
  adminReorderLocations: vi.fn(),
}));

vi.mock('@/hooks/useReorderAnimation', () => ({
  useReorderAnimation: vi.fn(() => ({ ref: { current: null }, capture: mockCapture })),
  useExpandCollapse: vi.fn(() => ({ current: null })),
}));

describe('LocationAdmin create single Arabic name', () => {
  beforeEach(() => {
    vi.mocked(adminGetLocations).mockReset().mockResolvedValue([]);
    vi.mocked(adminCreateLocation).mockReset().mockResolvedValue(undefined);
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  async function openCreateForm(): Promise<void> {
    render(<LocationAdmin />);
    await screen.findByText('لا توجد مواقع بعد.');
    fireEvent.click(screen.getByTestId('location-create-toggle'));
  }

  it('exposes exactly one name field with no second name, type select, or id control', async () => {
    const { container } = render(<LocationAdmin />);
    await screen.findByText('لا توجد مواقع بعد.');
    fireEvent.click(screen.getByTestId('location-create-toggle'));

    expect(screen.getAllByLabelText('الاسم', { exact: false })).toHaveLength(1);
    expect(screen.getByLabelText('الاسم', { exact: false })).toBeInTheDocument();
    expect(screen.queryByLabelText('الاسم (عربي)', { exact: false })).toBeNull();
    expect(container.querySelector('select')).toBeNull();
    expect(screen.queryByText('النوع')).toBeNull();
    expect(screen.queryByText('المعرّف')).toBeNull();
  });

  it('strips Latin letters and digits while typing', async () => {
    await openCreateForm();

    const input = screen.getByLabelText('الاسم', { exact: false }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'القاهرةCairo123' } });

    expect(input.value).toBe('القاهرة');
  });

  it('always shows the Arabic-only hint under the field', async () => {
    await openCreateForm();

    expect(screen.getByText('الحروف العربية فقط')).toBeInTheDocument();
  });

  it('submits the trimmed Arabic name to both name fields with no id or type', async () => {
    await openCreateForm();

    const input = screen.getByLabelText('الاسم', { exact: false }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  دمياط الجديدة  ' } });
    fireEvent.click(screen.getByTestId('location-create-submit'));

    await waitFor(() => expect(vi.mocked(adminCreateLocation)).toHaveBeenCalledTimes(1));
    const arg = vi.mocked(adminCreateLocation).mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(arg).toEqual({ name: 'دمياط الجديدة', nameAr: 'دمياط الجديدة', displayOrder: 0 });
    expect(arg).not.toHaveProperty('id');
    expect(arg).not.toHaveProperty('type');
  });

  it('rejects an empty submit with a required error and no API call', async () => {
    await openCreateForm();

    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByText('الاسم مطلوب')).toBeInTheDocument();
    expect(vi.mocked(adminCreateLocation)).not.toHaveBeenCalled();
  });
});
