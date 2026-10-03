import { FocusTrap } from 'focus-trap-react';

import { cn } from '@/lib/utils';

import type { NavItem, SectionKey } from './AdminApp';

interface AdminNavProps {
  active: SectionKey;
  items: NavItem[];
  open: boolean;
  isDesktop: boolean;
  email: string;
  onSelect: (key: SectionKey) => void;
  onLogout: () => void;
}

export function AdminNav({
  active,
  items,
  open,
  isDesktop,
  email,
  onSelect,
  onLogout,
}: AdminNavProps) {
  // `open` alone must not gate accessibility: on desktop the nav is always visible, and
  // `inert` there would strip the page's only nav from the a11y tree and the tab order.
  const hiddenFromAT = !open && !isDesktop;
  return (
    <FocusTrap
      active={open}
      focusTrapOptions={{ allowOutsideClick: true, tabbableOptions: { displayCheck: 'none' } }}
    >
      <aside
        id="admin-drawer"
        data-testid="admin-drawer"
        inert={hiddenFromAT}
        aria-hidden={hiddenFromAT ? 'true' : undefined}
        className={cn(
          'fixed inset-y-0 start-0 z-50 flex w-[85vw] max-w-72 flex-col overflow-y-auto border-e border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-transform duration-300 motion-reduce:transition-none lg:static lg:z-auto lg:w-60 lg:translate-x-0 lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
        )}
      >
        <h2 className="mb-4 text-lg font-bold">لوحة تحكم وصلني</h2>
        <nav aria-label="أقسام لوحة التحكم" className="flex flex-col gap-1">
          {items.map((item) => (
            <button
              key={item.key}
              data-testid={item.testid ?? `admin-nav-${item.key}`}
              aria-current={active === item.key ? 'page' : undefined}
              onClick={() => onSelect(item.key)}
              className={cn(
                'min-h-[44px] w-full touch-manipulation rounded-lg px-3 py-2 text-start text-sm font-medium transition',
                active === item.key
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-[hsl(var(--muted))]',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          data-testid="admin-logout"
          onClick={onLogout}
          className="mt-4 min-h-[44px] w-full touch-manipulation rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))]"
        >
          تسجيل الخروج
        </button>
        <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">مسجّل الدخول باسم {email}</p>
      </aside>
    </FocusTrap>
  );
}
