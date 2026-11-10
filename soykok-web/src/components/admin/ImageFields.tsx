'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { useUploadImage } from '@/hooks/useCatalog';
import { productImageSrc } from '@/lib/product-image';

const SW = 1.75;
const MAX_MB = 5;
const ACCEPT = 'image/jpeg,image/png,image/webp';

/** Seçilen dosyaları sırayla yükler; hatalı dosyada durup mesaj verir. */
function useUploader() {
  const upload = useUploadImage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (files: FileList | null): Promise<string[]> => {
    setError(null);
    const list = Array.from(files ?? []);
    const urls: string[] = [];
    if (!list.length) return urls;
    setBusy(true);
    try {
      for (const file of list) {
        if (!ACCEPT.split(',').includes(file.type)) throw new Error(`"${file.name}": yalnızca JPG, PNG veya WEBP yüklenebilir.`);
        if (file.size > MAX_MB * 1024 * 1024) throw new Error(`"${file.name}": en fazla ${MAX_MB} MB olabilir.`);
        const { url } = await upload.mutateAsync(file);
        urls.push(url);
      }
    } catch (err) {
      setError((err as Error).message || 'Görsel yüklenemedi.');
    } finally {
      setBusy(false);
    }
    return urls;
  };

  return { run, busy, error };
}

/** Gizli dosya seçici + buton */
function UploadButton({ label, multiple, busy, onFiles }: { label: string; multiple?: boolean; busy: boolean; onFiles: (f: FileList | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = ''; // aynı dosya tekrar seçilebilsin
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="flex h-10 shrink-0 items-center gap-2 rounded border border-brand-900 px-3 text-xs font-semibold text-brand-900 hover:bg-brand-900 hover:text-white disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" strokeWidth={SW} aria-hidden />}
        {busy ? 'Yükleniyor…' : label}
      </button>
    </>
  );
}

/** Ana görsel: önizleme + bilgisayardan yükle (ya da hazır dosya adı yaz) */
export function MainImageField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const up = useUploader();
  const [manual, setManual] = useState(false);
  const shown = value.trim();

  return (
    <div>
      <span className="form-label">Ana görsel *</span>
      <div className="flex items-start gap-3">
        <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded border border-gray-200 bg-gray-50">
          {shown ? (
            // Yazılan/yüklenen adresin önizlemesi; next/image olmayan dosyada hata verdiği için düz <img>
            // eslint-disable-next-line @next/next/no-img-element
            <img src={productImageSrc(shown)} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-gray-300" strokeWidth={SW} aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <UploadButton
            label={shown ? 'Görseli değiştir' : 'Bilgisayardan yükle'}
            busy={up.busy}
            onFiles={async (files) => {
              const [url] = await up.run(files);
              if (url) onChange(url);
            }}
          />
          {manual ? (
            <input
              className="form-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="laminat-oak-naturel.jpg"
              aria-invalid={Boolean(error)}
            />
          ) : (
            <button type="button" onClick={() => setManual(true)} className="block text-[11px] text-gray-500 underline">
              Hazır dosya adı yaz (public/images/products)
            </button>
          )}
        </div>
      </div>
      {(up.error || error) && <span className="form-error block">{up.error ?? error}</span>}
      <span className="mt-1 block text-[11px] text-gray-500">JPG, PNG veya WEBP; en fazla {MAX_MB} MB. Kare ya da yatay görsel önerilir.</span>
    </div>
  );
}

/** Galeri: küçük resimler (sil) + çoklu yükleme */
export function GalleryField({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const up = useUploader();
  const [name, setName] = useState('');

  const addName = () => {
    const n = name.trim();
    if (n && !values.includes(n)) onChange([...values, n]);
    setName('');
  };

  return (
    <div>
      <span className="form-label">Galeri görselleri</span>
      {values.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {values.map((v, i) => (
            <li key={v} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productImageSrc(v)} alt={`Galeri ${i + 1}`} className="h-16 w-20 rounded border border-gray-200 object-cover" />
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-gray-900 text-white"
                aria-label={`Galeri görseli ${i + 1} kaldır`}
              >
                <X className="size-3" strokeWidth={2.5} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <UploadButton
          label="Görsel ekle"
          multiple
          busy={up.busy}
          onFiles={async (files) => {
            const urls = await up.run(files);
            if (urls.length) onChange([...values, ...urls.filter((u) => !values.includes(u))]);
          }}
        />
        <input
          className="form-input min-w-40 flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addName();
            }
          }}
          onBlur={addName}
          placeholder="ya da hazır dosya adı + Enter"
        />
      </div>
      {up.error && <span className="form-error block">{up.error}</span>}
      <span className="mt-1 block text-[11px] text-gray-500">Ürün sayfasında ana görselden sonra bu sırayla gösterilir.</span>
    </div>
  );
}
