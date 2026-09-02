import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { adminGetContent, adminUpdateContent } from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton } from './ui';

interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  facebook: string;
}

const EMPTY: ContactInfo = {
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  facebook: '',
};

export function ContentAdmin() {
  const [info, setInfo] = useState<ContactInfo>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminGetContent('contactInfo')
      .then((value) => {
        if (cancelled) return;
        if (value && typeof value === 'object') {
          setInfo({ ...EMPTY, ...(value as ContactInfo) });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'فشل تحميل المحتوى');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(field: keyof ContactInfo, value: string) {
    setInfo((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await adminUpdateContent('contactInfo', info);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ المحتوى');
    }
  }

  return (
    <Panel title="المحتوى — معلومات الاتصال">
      {error && <ErrorText message={error} />}
      {saved && (
        <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40">
          تم الحفظ.
        </p>
      )}
      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field label="الهاتف" value={info.phone} onChange={(v) => update('phone', v)} />
          <Field label="واتساب" value={info.whatsapp} onChange={(v) => update('whatsapp', v)} />
          <Field label="البريد الإلكتروني" type="email" value={info.email} onChange={(v) => update('email', v)} />
          <Field label="فيسبوك" value={info.facebook} onChange={(v) => update('facebook', v)} />
          <Field label="العنوان" value={info.address} onChange={(v) => update('address', v)} />
          <div className="flex items-end">
            <PrimaryButton type="submit">حفظ معلومات الاتصال</PrimaryButton>
          </div>
        </form>
      )}
    </Panel>
  );
}
