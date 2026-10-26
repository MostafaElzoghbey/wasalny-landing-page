import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Menu, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { fetchAdminMe, adminLogin, adminLogout } from '@/data/api';
import { Field, ErrorText, PrimaryButton } from './ui';
import { FaqAdmin } from './FaqAdmin';
import { CarAdmin } from './CarAdmin';
import { RouteDataAdmin } from './RouteDataAdmin';
import { LocationAdmin } from './LocationAdmin';
import { RouteGroupAdmin } from './RouteGroupAdmin';
import { PricingConfigAdmin } from './PricingConfigAdmin';
import { ContentAdmin } from './ContentAdmin';
import { IdentityAdmin } from './IdentityAdmin';
import { AdminNav } from './AdminNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export type SectionKey =
  | 'cars'
  | 'locations'
  | 'routeGroups'
  | 'routeData'
  | 'pricingConfig'
  | 'faqs'
  | 'content'
  | 'identity';

export interface NavItem {
  key: SectionKey;
  label: string;
  testid?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'cars', label: 'السيارات' },
  { key: 'identity', label: 'هوية وصلني' },
  { key: 'locations', label: 'المواقع' },
  { key: 'routeGroups', label: 'مجموعات المسارات' },
  { key: 'routeData', label: 'بيانات المسارات' },
  { key: 'pricingConfig', label: 'إعدادات التسعير' },
  { key: 'faqs', label: 'الأسئلة الشائعة', testid: 'admin-nav-faqs' },
  { key: 'content', label: 'المحتوى' },
];

const SECTION_STORAGE_KEY = 'wasalny-admin-section';

function readStoredSection(): SectionKey | null {
  try {
    const saved = window.localStorage.getItem(SECTION_STORAGE_KEY);
    if (saved && NAV_ITEMS.some((item) => item.key === saved)) return saved as SectionKey;
  } catch {
    return null;
  }
  return null;
}

function storeSection(key: SectionKey): void {
  try {
    window.localStorage.setItem(SECTION_STORAGE_KEY, key);
  } catch {
    return;
  }
}

export function AdminApp() {
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<SectionKey>(() => readStoredSection() ?? 'cars');
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  function selectSection(key: SectionKey): void {
    setActive(key);
    storeSection(key);
  }

  function closeNav(): void {
    setNavOpen(false);
    menuButtonRef.current?.focus();
  }

  function handleSelect(key: SectionKey): void {
    selectSection(key);
    closeNav();
  }

  function handleToggle(): void {
    if (navOpen) closeNav();
    else setNavOpen(true);
  }

  useEffect(() => {
    let cancelled = false;
    fetchAdminMe()
      .then((me) => {
        if (!cancelled) setEmail(me ? me.email : null);
      })
      .catch(() => {
        if (!cancelled) setEmail(null);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setNavOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navOpen]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError(null);
    try {
      const res = await adminLogin(loginEmail, loginPassword);
      if (res.ok) {
        const me = await fetchAdminMe();
        setEmail(me ? me.email : loginEmail);
      } else {
        setLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'فشل تسجيل الدخول.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    closeNav();
    await adminLogout();
    setEmail(null);
  }

  // Leaving the drawer open across a resize into desktop would keep a focus trap
  // active with no visible trigger, jailing keyboard focus in the sidebar.
  useEffect(() => {
    if (isDesktop) setNavOpen(false);
  }, [isDesktop]);

  if (!checked) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" dir="rtl">
        <p className="text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p>
      </div>
    );
  }

  if (email === null) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] p-4"
        dir="rtl"
      >
        <form onSubmit={handleLogin} className="card w-full max-w-sm p-6">
          <h1 className="mb-4 text-xl font-bold text-[hsl(var(--foreground))]">تسجيل دخول الإدارة</h1>
          {loginError && <ErrorText message={loginError} />}
          <Field
            label="البريد الإلكتروني"
            testid="admin-email"
            type="email"
            value={loginEmail}
            onChange={setLoginEmail}
            required
          />
          <Field
            label="كلمة المرور"
            testid="admin-password"
            type="password"
            value={loginPassword}
            onChange={setLoginPassword}
            required
          />
          <PrimaryButton type="submit" data-testid="admin-login-submit" disabled={busy}>
            {busy ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
          </PrimaryButton>
        </form>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] lg:h-[100dvh] lg:flex-row lg:overflow-hidden"
      dir="rtl"
    >
      <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
        <h2 className="text-lg font-bold">لوحة تحكم وصلني</h2>
        <button
          ref={menuButtonRef}
          type="button"
          data-testid="admin-menu-button"
          aria-expanded={navOpen}
          aria-controls="admin-drawer"
          aria-label={navOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          onClick={handleToggle}
          className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg hover:bg-[hsl(var(--muted))]"
        >
          {navOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>
      <div
        data-testid="admin-drawer-backdrop"
        aria-hidden="true"
        onClick={closeNav}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 motion-reduce:transition-none lg:hidden',
          navOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <AdminNav
        active={active}
        items={NAV_ITEMS}
        open={navOpen}
        isDesktop={isDesktop}
        email={email}
        onSelect={handleSelect}
        onLogout={handleLogout}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        {active === 'cars' && <CarAdmin />}
        {active === 'locations' && <LocationAdmin />}
        {active === 'routeGroups' && <RouteGroupAdmin />}
        {active === 'routeData' && <RouteDataAdmin />}
        {active === 'pricingConfig' && <PricingConfigAdmin />}
        {active === 'faqs' && <FaqAdmin />}
        {active === 'content' && <ContentAdmin />}
        {active === 'identity' && <IdentityAdmin />}
      </main>
    </div>
  );
}
