// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useData } from '@/context/DataProvider';
import { FleetSection } from './FleetSection';

vi.mock('@/context/DataProvider', () => ({ useData: vi.fn() }));

vi.mock('@/lib/gsap', () => ({
  default: {
    fromTo: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      play: vi.fn(),
      reverse: vi.fn(),
      kill: vi.fn(),
    })),
    registerPlugin: vi.fn(),
    config: vi.fn(),
  },
  useGSAP: vi.fn(),
}));

const mockedUseData = vi.mocked(useData);

const carCategories = [
  { id: 'sedan', nameAr: 'سيدان', icon: 'Car' },
  { id: 'wedding', nameAr: 'زفاف', icon: 'Heart' },
];

const sedanCar = {
  id: 'car-sedan-1',
  nameAr: 'سيدان تجريبية',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف تجريبي',
  images: ['/img/sedan-1.jpg', '/img/sedan-2.jpg'],
  imageAlts: ['صورة 1', 'صورة 2'],
  features: ['تكييف'],
  displayOrder: 0,
};

const zeroImageCar = {
  ...sedanCar,
  id: 'car-sedan-empty',
  images: [],
  imageAlts: [],
};

const weddingCar = {
  id: 'car-wedding-1',
  nameAr: 'سيارة زفاف',
  category: 'wedding',
  categoryAr: 'زفاف',
  description: 'وصف الزفاف',
  images: ['/img/wedding-1.jpg', '/img/wedding-2.jpg'],
  imageAlts: ['زفاف 1', 'زفاف 2'],
  features: ['تزيين'],
  displayOrder: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FleetSection empty states', () => {
  it('cars=[] renders friendly empty fallback without crashing on activeCar.images', () => {
    mockedUseData.mockReturnValue({ cars: [], carCategories } as never);
    const { container } = render(<FleetSection />);
    expect(container.querySelector('[data-testid="fleet-empty"]')).not.toBeNull();
    expect(screen.getByText(/لا توجد سيارات متاحة/i)).toBeInTheDocument();
  });

  it('zero-image car renders placeholder with safe counter, autoplay off, next/prev no-op', () => {
    mockedUseData.mockReturnValue({ cars: [zeroImageCar], carCategories } as never);
    const { container } = render(<FleetSection />);
    expect(container.querySelector('[data-testid="fleet-no-images"]')).not.toBeNull();
    expect(container.textContent).not.toMatch(/NaN/);
    expect(screen.getByText('0/0')).toBeInTheDocument();

    const nextBtn = screen.getByLabelText('الصورة التالية');
    const prevBtn = screen.getByLabelText('الصورة السابقة');
    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
    expect(container.textContent).not.toMatch(/NaN/);
    expect(screen.getByText('0/0')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="fleet-no-images"]')).not.toBeNull();
  });

  it('wedding car renders via the same gallery path', () => {
    mockedUseData.mockReturnValue({
      cars: [sedanCar, weddingCar],
      carCategories,
    } as never);
    const { container } = render(<FleetSection />);
    fireEvent.click(screen.getByText('زفاف'));
    expect(screen.getByText('سيارة زفاف')).toBeInTheDocument();
    expect(screen.getAllByText('1/2')).toHaveLength(2);
    expect(container.textContent).not.toMatch(/NaN/);
  });
});
