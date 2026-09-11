// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';

import type { Car } from '@/types';
import { adminCreateCar, adminGetCars, adminDeleteCar, adminUpdateCar } from '@/data/api';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { CarAdmin } from './CarAdmin';
import { CarCard } from './CarCard';

const { mockCapture } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
}));

vi.mock('@/data/api', () => ({
  adminGetCars: vi.fn(),
  adminCreateCar: vi.fn(),
  adminUpdateCar: vi.fn(),
  adminDeleteCar: vi.fn(),
  adminReorderCars: vi.fn(),
}));

vi.mock('@/hooks/useReorderAnimation', () => ({
  useReorderAnimation: vi.fn(() => ({ ref: { current: null }, capture: mockCapture })),
  useExpandCollapse: vi.fn(() => ({ current: null })),
}));

const fleetCars: Car[] = [
  { id: 'car-sedan-1', nameAr: 'سيدان ١', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 0 },
  { id: 'car-suv-1', nameAr: 'دفع ١', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 0 },
];

const newCar: Car = {
  id: 'car-sedan-new',
  nameAr: 'سيدان جديدة',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: '',
  images: ['https://cdn.example.com/new.jpg'],
  features: [],
  displayOrder: 1,
};

function addImageUrl(form: HTMLElement, url: string): void {
  const urlInput = within(form).getByTestId('car-images-create-url-input') as HTMLInputElement;
  fireEvent.change(urlInput, { target: { value: url } });
  fireEvent.click(within(form).getByTestId('car-images-create-url-add'));
}

describe('CarAdmin double-submit guard', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockReset().mockResolvedValue(fleetCars);
    vi.mocked(adminCreateCar).mockReset().mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(newCar as unknown as Car), 50)));
    vi.mocked(adminUpdateCar).mockReset();
    vi.mocked(adminDeleteCar).mockReset();
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  it('double-click on create sends exactly one POST', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');

    const drill = screen.getByTestId('category-drilldown-sedan');
    const form = within(drill).getByTestId('fleet-create');
    const input = form.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'سيارة جديدة' } });
    addImageUrl(form, 'https://cdn.example.com/new.jpg');

    const submitBtn = within(form).getByText('إنشاء سيارة');
    // Rapid double-click
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => expect(vi.mocked(adminCreateCar)).toHaveBeenCalledTimes(1));
  });

  it('submit button is disabled while creating', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');

    const drill = screen.getByTestId('category-drilldown-sedan');
    const form = within(drill).getByTestId('fleet-create');
    const input = form.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'سيارة جديدة' } });
    addImageUrl(form, 'https://cdn.example.com/new.jpg');

    const submitBtn = within(form).getByText('إنشاء سيارة') as HTMLButtonElement;
    fireEvent.click(submitBtn);

    // Button should be disabled while the async create is in-flight
    await waitFor(() => {
      expect(submitBtn.disabled).toBe(true);
    });
  });
});

describe('CarAdmin cars visible directly, no expand needed', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockReset().mockResolvedValue(fleetCars);
    vi.mocked(adminCreateCar).mockReset();
    vi.mocked(adminUpdateCar).mockReset();
    vi.mocked(adminDeleteCar).mockReset();
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  it('drilldown shows every car expanded without clicking', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');

    expect(screen.getByTestId('car-imagerow-edit-car-sedan-1-0')).toBeInTheDocument();
  });

  it('switching category shows the new category cars directly', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');

    fireEvent.click(screen.getByTestId('category-back'));
    await screen.findByTestId('category-grid');

    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');

    expect(screen.getByTestId('car-imagerow-edit-car-suv-1-0')).toBeInTheDocument();
    expect(screen.queryByTestId('car-imagerow-edit-car-sedan-1-0')).toBeNull();
  });
});

describe('CarCard error/confirmDelete leak guards', () => {
  const carNoImages: Car = {
    id: 'car-test-1',
    nameAr: 'سيارة اختبار',
    category: 'sedan',
    categoryAr: 'سيدان',
    description: 'وصف',
    images: [],
    features: [],
    displayOrder: 0,
  };

  const carWithImages: Car = {
    ...carNoImages,
    images: ['https://cdn.example.com/test.jpg'],
  };

  it('error cleared on cancel', () => {
    render(
      <CarCard group={carNoImages} onUpdated={vi.fn()} onDeleted={vi.fn()} />,
    );

    fireEvent.click(screen.getByTestId('car-edit-car-test-1'));
    fireEvent.click(screen.getByTestId('car-save-car-test-1'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('car-cancel-car-test-1'));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('car-edit-car-test-1')).toBeInTheDocument();
  });

  it('confirmDelete cleared on cancel', () => {
    render(
      <CarCard group={carNoImages} onUpdated={vi.fn()} onDeleted={vi.fn()} />,
    );

    fireEvent.click(screen.getByTestId('car-delete-car-test-1'));
    expect(screen.getByTestId('car-delete-confirm-car-test-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('car-delete-cancel-car-test-1'));
    expect(screen.queryByTestId('car-delete-confirm-car-test-1')).toBeNull();
    expect(screen.getByTestId('car-delete-car-test-1')).toBeInTheDocument();
  });

  it('edit and delete buttons disabled during save', async () => {
    vi.mocked(adminUpdateCar).mockImplementation(() => new Promise(() => {}));

    render(
      <CarCard group={carWithImages} onUpdated={vi.fn()} onDeleted={vi.fn()} />,
    );

    fireEvent.click(screen.getByTestId('car-edit-car-test-1'));

    const saveBtn = screen.getByTestId('car-save-car-test-1') as HTMLButtonElement;
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveBtn.disabled).toBe(true);
    });
  });
});

describe('CarCard draft resync on group prop change', () => {
  const carV1: Car = {
    id: 'car-resync-1',
    nameAr: 'النسخة الأولى',
    category: 'sedan',
    categoryAr: 'سيدان',
    description: 'وصف قديم',
    images: [],
    features: [],
    displayOrder: 0,
  };

  const carV2: Car = {
    ...carV1,
    nameAr: 'النسخة الثانية',
    description: 'وصف جديد',
  };

  it('draft resyncs when group changes while NOT editing', () => {
    const { rerender } = render(
      <CarCard group={carV1} onUpdated={vi.fn()} onDeleted={vi.fn()} />,
    );

    // Simulate server update to group prop
    rerender(
      <CarCard group={carV2} onUpdated={vi.fn()} onDeleted={vi.fn()} />,
    );

    // Enter edit — draft should reflect v2, not v1
    fireEvent.click(screen.getByTestId('car-edit-car-resync-1'));
    const nameInput = screen.getByDisplayValue('النسخة الثانية') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
  });

  it('draft does NOT resync when group changes while editing', () => {
    const { rerender } = render(
      <CarCard group={carV1} onUpdated={vi.fn()} onDeleted={vi.fn()} />,
    );

    // Enter edit mode
    fireEvent.click(screen.getByTestId('car-edit-car-resync-1'));

    // Simulate server update while editing
    rerender(
      <CarCard group={carV2} onUpdated={vi.fn()} onDeleted={vi.fn()} />,
    );

    // Draft should still show v1 (user's in-progress edits preserved)
    const nameInput = screen.getByDisplayValue('النسخة الأولى') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
  });
});
