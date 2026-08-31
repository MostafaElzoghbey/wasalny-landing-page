import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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

type SectionKey =
  | 'cars'
  | 'locations'
  | 'routeGroups'
  | 'routeData'
  | 'pricingConfig'
  | 'faqs'
  | 'content';

interface NavItem {
  key: SectionKey;
  label: string;
  testid?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'cars', label: 'Cars' },
  { key: 'locations', label: 'Locations' },
  { key: 'routeGroups', label: 'Route Groups' },
  { key: 'routeData', label: 'Route Data' },
  { key: 'pricingConfig', label: 'Pricing Config' },
  { key: 'faqs', label: 'FAQs', testid: 'admin-nav-faqs' },
  { key: 'content', label: 'Content' },
];

export function AdminApp() {
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<SectionKey>('faqs');

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
        setLoginError('Invalid email or password.');
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await adminLogout();
    setEmail(null);
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center" dir="ltr">
        <p className="text-[hsl(var(--muted-foreground))]">Loading…</p>
      </div>
    );
  }

  if (email === null) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4"
        dir="ltr"
      >
        <form onSubmit={handleLogin} className="card w-full max-w-sm p-6">
          <h1 className="mb-4 text-xl font-bold text-[hsl(var(--foreground))]">Admin Login</h1>
          {loginError && <ErrorText message={loginError} />}
          <Field
            label="Email"
            testid="admin-email"
            type="email"
            value={loginEmail}
            onChange={setLoginEmail}
            required
          />
          <Field
            label="Password"
            testid="admin-password"
            type="password"
            value={loginPassword}
            onChange={setLoginPassword}
            required
          />
          <PrimaryButton type="submit" data-testid="admin-login-submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Login'}
          </PrimaryButton>
        </form>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
      dir="ltr"
    >
      <aside className="w-60 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h2 className="mb-4 text-lg font-bold">Wasalny Admin</h2>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              data-testid={item.testid}
              onClick={() => setActive(item.key)}
              className={cn(
                'rounded-lg px-3 py-2 text-left text-sm font-medium transition',
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
          onClick={handleLogout}
          className="mt-4 w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))]"
        >
          Logout
        </button>
        <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">Signed in as {email}</p>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {active === 'cars' && <CarAdmin />}
        {active === 'locations' && <LocationAdmin />}
        {active === 'routeGroups' && <RouteGroupAdmin />}
        {active === 'routeData' && <RouteDataAdmin />}
        {active === 'pricingConfig' && <PricingConfigAdmin />}
        {active === 'faqs' && <FaqAdmin />}
        {active === 'content' && <ContentAdmin />}
      </main>
    </div>
  );
}
