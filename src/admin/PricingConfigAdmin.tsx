import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { adminSetPricingConfig, fetchPricing } from '@/data/api';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';

function normalizeWhatsappNumber(raw: string): string {
  return raw.replace(/[\s-]/g, '').trim();
}

function isValidWhatsappNumber(normalized: string): boolean {
  return /^\+?[0-9]{7,15}$/.test(normalized);
}

export function PricingConfigAdmin() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPricing();
        if (!cancelled) {
          setWhatsappNumber(data.pricingConfig.whatsappNumber ?? '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load pricing config');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const normalized = normalizeWhatsappNumber(whatsappNumber);

    if (!normalized) {
      setError('رقم واتساب مطلوب');
      return;
    }

    if (!isValidWhatsappNumber(normalized)) {
      setError('رقم غير صالح — يجب أن يكون 7 إلى 15 رقمًا، يسمح بـ + في البداية (مثال: +201005656117)');
      return;
    }

    setSaving(true);
    try {
      await adminSetPricingConfig('whatsappNumber', normalized);
      setWhatsappNumber(normalized);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing config');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="pricing-config-panel">
      <Panel title="إعدادات الحجز — Pricing Config">

        {error && <ErrorText message={error} />}

        {saved && (
          <p
            data-testid="pricing-config-saved"
            className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40"
          >
            Saved.
          </p>
        )}

        {loading ? (
          <p className="py-4 text-sm text-[hsl(var(--muted-foreground))]">جاري التحميل…</p>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md" noValidate>
            <Field
              label="رقم واتساب للحجز"
              testid="pricing-config-whatsapp-input"
              type="tel"
              value={whatsappNumber}
              onChange={(v) => {
                setWhatsappNumber(v);
                if (saved) setSaved(false);
                if (error) setError(null);
              }}
              placeholder="+20..."
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              required
            />
            <p
              data-testid="pricing-config-help"
              className="text-xs text-[hsl(var(--muted-foreground))] mt-1"
            >
              هذا الرقم يُستخدم للحجز عبر واتساب
            </p>

            <div className="mt-4">
              <PrimaryButton
                type="submit"
                data-testid="pricing-config-save"
                disabled={saving}
              >
                {saving ? 'جاري الحفظ…' : 'Save'}
              </PrimaryButton>
            </div>
          </form>
        )}
      </Panel>
    </div>
  );
}
