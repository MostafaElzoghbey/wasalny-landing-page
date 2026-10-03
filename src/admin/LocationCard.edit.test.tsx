// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Location } from '@/types/pricing';
import { adminUpdateLocation } from '@/data/api';
import { LocationCard } from './LocationCard';

vi.mock('@/data/api', () => ({
  adminDeleteLocation: vi.fn(),
  adminUpdateLocation: vi.fn(),
}));

const fixture: Location = {
  id: 'loc-1',
  name: 'Cairo',
  nameAr: 'القاهرة',
  type: 'travel',
  displayOrder: 0,
};

function renderCard(options?: { expanded?: boolean; onUpdated?: (next: Location) => void }): {
  container: HTMLElement;
  onUpdated: (next: Location) => void;
} {
  const onUpdated = options?.onUpdated ?? vi.fn();
  const { container } = render(
    <LocationCard
      group={fixture}
      expanded={options?.expanded ?? true}
      onToggle={vi.fn()}
      onUpdated={onUpdated}
      onDeleted={vi.fn()}
    />,
  );
  return { container, onUpdated };
}

function nameInput(): HTMLInputElement {
  return screen.getByLabelText('الاسم', { exact: false }) as HTMLInputElement;
}

describe('LocationCard arabic-only edit', () => {
  beforeEach(() => {
    vi.mocked(adminUpdateLocation).mockReset().mockResolvedValue(undefined);
  });

  it('collapsed header shows only the Arabic name', () => {
    renderCard({ expanded: false });
    const card = screen.getByTestId('location-card-loc-1');
    expect(card.textContent).toContain('القاهرة');
    expect(card.textContent).not.toContain('loc-1');
    expect(card.textContent).not.toContain('Cairo');
    expect(card.textContent).not.toContain('travel');
    expect(card.textContent).not.toContain('سفر');
    expect(screen.queryByText('Cairo')).toBeNull();
    expect(screen.queryByText('travel')).toBeNull();
  });

  it('expanded summary shows a single name tile', () => {
    renderCard({ expanded: true });
    expect(screen.getAllByText('الاسم')).toHaveLength(1);
    expect(screen.getAllByText('القاهرة')).toHaveLength(2);
    expect(screen.queryByText('الاسم (عربي)')).toBeNull();
    expect(screen.queryByText('النوع')).toBeNull();
    expect(screen.queryByText('المعرّف')).toBeNull();
  });

  it('edit form exposes exactly one Arabic name field with hint and no type select', () => {
    const { container } = renderCard({ expanded: true });
    fireEvent.click(screen.getByTestId('location-edit-loc-1'));
    expect(screen.getAllByLabelText('الاسم', { exact: false })).toHaveLength(1);
    expect(screen.getByText('الحروف العربية فقط')).not.toBeNull();
    expect(container.querySelector('select')).toBeNull();
    expect(screen.queryByText('النوع')).toBeNull();
  });

  it('filters non-Arabic characters while typing', () => {
    renderCard({ expanded: true });
    fireEvent.click(screen.getByTestId('location-edit-loc-1'));
    const input = nameInput();
    fireEvent.change(input, { target: { value: 'الإسكندريةXYZ' } });
    expect(input.value).toBe('الإسكندرية');
  });

  it('save sends trimmed Arabic name without type and preserves type for parent', async () => {
    const onUpdated = vi.fn();
    renderCard({ expanded: true, onUpdated });
    fireEvent.click(screen.getByTestId('location-edit-loc-1'));
    const input = nameInput();
    fireEvent.change(input, { target: { value: 'الإسكندريةXYZ' } });
    fireEvent.click(screen.getByTestId('location-save-loc-1'));
    await waitFor(() => expect(vi.mocked(adminUpdateLocation)).toHaveBeenCalled());
    expect(vi.mocked(adminUpdateLocation)).toHaveBeenCalledWith('loc-1', {
      name: 'الإسكندرية',
      nameAr: 'الإسكندرية',
    });
    const patch = vi.mocked(adminUpdateLocation).mock.calls[0]?.[1] as unknown as Record<string, unknown>;
    expect('type' in patch).toBe(false);
    expect(onUpdated).toHaveBeenCalledTimes(1);
    const next = onUpdated.mock.calls[0]?.[0] as Location;
    expect(next.nameAr).toBe('الإسكندرية');
    expect(next.type).toBe('travel');
    expect(next.displayOrder).toBe(0);
  });

  it('cancel discards the edit and restores the original name', () => {
    renderCard({ expanded: true });
    fireEvent.click(screen.getByTestId('location-edit-loc-1'));
    const input = nameInput();
    fireEvent.change(input, { target: { value: 'الإسكندرية' } });
    expect(input.value).toBe('الإسكندرية');
    fireEvent.click(screen.getByTestId('location-cancel-loc-1'));
    expect(screen.queryByDisplayValue('الإسكندرية')).toBeNull();
    expect(screen.getAllByText('القاهرة')).toHaveLength(2);
  });
});
