import { useCallback, useEffect, useRef, useState } from "react";

interface ImageDropzoneProps {
  mode: "single" | "multiple";
  value: string | string[];
  onChange: (next: string | string[]) => void;
  maxImages?: number;
  testId?: string;
  label?: string;
}

const URL_RE = /^https?:\/\/.+/;
const EXT_RE = /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i;

function validateUrl(url: string): string | null {
  if (!URL_RE.test(url)) return "الرابط يجب أن يبدأ بـ http:// أو https://";
  if (!EXT_RE.test(url)) return "صيغة الصورة غير مدعومة (jpg, png, webp, svg)";
  return null;
}

export function ImageDropzone({ mode, value, onChange, maxImages, testId = "image-dropzone", label }: ImageDropzoneProps) {
  const normalized: string[] = Array.isArray(value) ? value : value ? [value] : [];
  const limit = maxImages ?? (mode === "single" ? 1 : 10);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      for (const u of blobUrlsRef.current) URL.revokeObjectURL(u);
    };
  }, []);

  const emit = useCallback(
    (next: string[]) => {
      if (mode === "single") onChange(next[0] ?? "");
      else onChange(next);
    },
    [mode, onChange],
  );

  const addUrls = useCallback(
    (urls: string[]) => {
      if (urls.length === 0) return;
      if (mode === "single") {
        const err = validateUrl(urls[0]);
        if (err) { setError(err); return; }
        setError(null);
        emit([urls[0]]);
        return;
      }
      const next = [...normalized];
      for (const u of urls) {
        const err = validateUrl(u);
        if (err) { setError(err); continue; }
        if (next.length >= limit) { setError(`الحد الأقصى ${limit} صور`); break; }
        if (next.includes(u)) continue;
        next.push(u);
        setError(null);
      }
      emit(next);
    },
    [emit, limit, mode, normalized],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (mode === "single") {
        const f = files[0];
        const url = URL.createObjectURL(f);
        blobUrlsRef.current.add(url);
        setError(null);
        emit([url]);
        return;
      }
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (normalized.length + urls.length >= limit) { setError(`الحد الأقصى ${limit} صور`); break; }
        const url = URL.createObjectURL(f);
        blobUrlsRef.current.add(url);
        urls.push(url);
      }
      if (urls.length) { setError(null); emit([...normalized, ...urls]); }
    },
    [emit, limit, mode, normalized],
  );

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...normalized];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    emit(next);
  }

  function removeAt(idx: number) {
    const url = normalized[idx];
    if (blobUrlsRef.current.has(url)) { URL.revokeObjectURL(url); blobUrlsRef.current.delete(url); }
    emit(normalized.filter((_, i) => i !== idx));
  }

  return (
    <div dir="rtl" data-testid={testId} className="w-full text-right">
      {label ? <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">{label}</span> : null}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${dragOver ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20" : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-primary-300"}`}
      >
        <p className="text-sm text-[hsl(var(--muted-foreground))]">اسحب الصور أو اضغط للاختيار</p>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          {mode === "single" ? "صورة واحدة" : `حتى ${limit} صور`}
        </p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" multiple={mode === "multiple"} className="hidden" onChange={(e) => { handleFiles(e.target.files); if (inputRef.current) inputRef.current.value = ""; }} onClick={(e) => e.stopPropagation()} />
      </div>

      <div className="mt-3 flex gap-2">
        <input dir="rtl" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="إضافة رابط" className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none" data-testid={`${testId}-url-input`} />
        <button type="button" onClick={() => { const v = urlInput.trim(); if (!v) return; addUrls([v]); setUrlInput(""); }} className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90" data-testid={`${testId}-url-add`}>
          إضافة
        </button>
      </div>

      {error ? <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40" role="alert">{error}</p> : null}

      {normalized.length > 0 ? (
        <ul className={`mt-3 grid gap-3 ${mode === "single" ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
          {normalized.map((src, idx) => (
            <li key={`${src}-${idx}`} data-testid={`dropzone-preview-${idx}`} draggable={mode === "multiple"} onDragStart={() => setDragIdx(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragIdx !== null) reorder(dragIdx, idx); setDragIdx(null); }} className="group relative overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <img src={src} alt="" className="h-28 w-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex" />
              <button type="button" data-testid={`dropzone-remove-${idx}`} onClick={() => removeAt(idx)} className="absolute left-1 top-1 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white">حذف</button>
              {mode === "multiple" ? (
                <>
                  <span data-testid={`dropzone-handle-${idx}`} className="absolute right-1 top-1 cursor-grab rounded bg-black/60 px-1.5 py-1 text-xs text-white">⋮⋮</span>
                  <div className="absolute bottom-1 left-1 flex gap-1">
                    <button type="button" disabled={idx === 0} onClick={() => reorder(idx, idx - 1)} className="rounded bg-white/90 px-1.5 py-0.5 text-xs disabled:opacity-40">↑</button>
                    <button type="button" disabled={idx === normalized.length - 1} onClick={() => reorder(idx, idx + 1)} className="rounded bg-white/90 px-1.5 py-0.5 text-xs disabled:opacity-40">↓</button>
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
