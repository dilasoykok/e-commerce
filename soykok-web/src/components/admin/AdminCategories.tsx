'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FolderPlus, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import {
  useAdminCategories,
  useDeleteCategory,
  useDeleteCategoryGroup,
  useSaveCategory,
  useSaveCategoryGroup,
} from '@/hooks/useAdminCategories';
import type { AdminCategoryGroupRow, AdminCategoryList, AdminCategoryRow } from '@/lib/types';

const SW = 1.75;

/** Açık olan form: üst kategori / alt kategori, düzenlenen kod (yeni ise null) */
type Editing =
  | { kind: 'group'; slug: string | null }
  | { kind: 'category'; slug: string | null; group?: string };

/**
 * /admin/kategoriler — üst kategori (menü başlığı: Boya ve Vernik, Hırdavat …) ve
 * alt kategori (ürünün kategorisi: İç Cephe Boyası, El Aletleri …) ekle / düzenle / sil.
 * Değişiklikler sitenin menüsüne, arama kutusuna ve filtrelere hemen yansır.
 */
export default function AdminCategories() {
  const list = useAdminCategories();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const data = list.data;
  const ungrouped = data?.categories.filter((c) => c.groups.length === 0) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Kategoriler</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            <strong>Üst kategori</strong> menüdeki başlıktır (ör. Boya ve Vernik). <strong>Alt kategori</strong> ürünlerin bağlandığı
            kategoridir (ör. İç Cephe Boyası); bir alt kategori birden çok üst kategoride olabilir.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing({ kind: 'group', slug: null })}
            className="flex h-10 items-center gap-2 rounded border border-brand-900 px-4 text-sm font-semibold text-brand-900 hover:bg-brand-900 hover:text-white"
          >
            <FolderPlus className="size-4" strokeWidth={SW} aria-hidden /> Yeni Üst Kategori
          </button>
          <button
            type="button"
            onClick={() => setEditing({ kind: 'category', slug: null })}
            className="flex h-10 items-center gap-2 rounded bg-brand-900 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="size-4" strokeWidth={SW} aria-hidden /> Yeni Alt Kategori
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {notice}
        </p>
      )}

      {list.isError ? (
        <p className="mt-6 text-sm text-sale">{list.error.message}</p>
      ) : !data ? (
        <div className="grid h-40 place-items-center">
          <Loader2 className="size-6 animate-spin text-gray-500" aria-label="Yükleniyor" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.groups.length === 0 && (
            <p className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Henüz üst kategori yok. &quot;Yeni Üst Kategori&quot; ile başlayın.
            </p>
          )}

          {data.groups.map((g) => (
            <GroupCard
              key={g.slug}
              group={g}
              categories={g.categories.map((s) => data.categories.find((c) => c.slug === s)).filter((c) => c !== undefined)}
              onEdit={() => setEditing({ kind: 'group', slug: g.slug })}
              onAddCategory={() => setEditing({ kind: 'category', slug: null, group: g.slug })}
              onEditCategory={(slug) => setEditing({ kind: 'category', slug })}
              onNotice={setNotice}
            />
          ))}

          {ungrouped.length > 0 && (
            <section className="rounded-md border border-gray-200 bg-white">
              <header className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-sm font-bold">Üst kategorisi olmayanlar</h2>
                <p className="text-xs text-gray-500">Bunlar menüde tek başına başlık olarak görünür.</p>
              </header>
              <CategoryRows rows={ungrouped} onEdit={(slug) => setEditing({ kind: 'category', slug })} onNotice={setNotice} />
            </section>
          )}
        </div>
      )}

      {editing && data && (
        <Drawer
          title={
            editing.kind === 'group'
              ? editing.slug ? 'Üst Kategoriyi Düzenle' : 'Yeni Üst Kategori'
              : editing.slug ? 'Alt Kategoriyi Düzenle' : 'Yeni Alt Kategori'
          }
          onClose={() => setEditing(null)}
        >
          {editing.kind === 'group' ? (
            <GroupForm
              key={editing.slug ?? 'new'}
              group={data.groups.find((g) => g.slug === editing.slug) ?? null}
              onSaved={(msg) => {
                setEditing(null);
                setNotice(msg);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <CategoryForm
              key={editing.slug ?? `new-${editing.group ?? ''}`}
              data={data}
              category={data.categories.find((c) => c.slug === editing.slug) ?? null}
              presetGroup={editing.group}
              onSaved={(msg) => {
                setEditing(null);
                setNotice(msg);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </Drawer>
      )}
    </div>
  );
}

/* ---------- Liste ---------- */

function GroupCard({
  group,
  categories,
  onEdit,
  onAddCategory,
  onEditCategory,
  onNotice,
}: {
  group: AdminCategoryGroupRow;
  categories: AdminCategoryRow[];
  onEdit: () => void;
  onAddCategory: () => void;
  onEditCategory: (slug: string) => void;
  onNotice: (msg: string) => void;
}) {
  const remove = useDeleteCategoryGroup();
  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold">{group.label}</h2>
          <p className="text-xs text-gray-500">
            Kod: {group.slug} · Sıra: {group.sortOrder} · {categories.length} alt kategori
          </p>
        </div>
        <Link
          href={`/urunler?kategori=${group.slug}`}
          target="_blank"
          className="grid size-8 place-items-center rounded text-gray-500 hover:bg-white hover:text-brand-900"
          aria-label={`${group.label} sitede aç`}
        >
          <ExternalLink className="size-4" strokeWidth={SW} aria-hidden />
        </Link>
        <IconButton label={`${group.label} düzenle`} onClick={onEdit}>
          <Pencil className="size-4" strokeWidth={SW} aria-hidden />
        </IconButton>
        <ConfirmDelete
          what={group.label}
          hint="Alt kategoriler ve ürünler silinmez."
          pending={remove.isPending}
          error={remove.error?.message}
          onConfirm={() => remove.mutate(group.slug, { onSuccess: () => onNotice(`"${group.label}" silindi.`) })}
        />
      </header>

      {categories.length > 0 ? (
        <CategoryRows rows={categories} onEdit={onEditCategory} onNotice={onNotice} />
      ) : (
        <p className="px-4 py-3 text-xs text-gray-500">Bu üst kategoride henüz alt kategori yok.</p>
      )}

      <div className="border-t border-gray-100 px-4 py-2">
        <button type="button" onClick={onAddCategory} className="flex items-center gap-1.5 text-xs font-semibold text-brand-900 hover:underline">
          <Plus className="size-3.5" strokeWidth={SW} aria-hidden /> Alt kategori ekle
        </button>
      </div>
    </section>
  );
}

function CategoryRows({ rows, onEdit, onNotice }: { rows: AdminCategoryRow[]; onEdit: (slug: string) => void; onNotice: (msg: string) => void }) {
  return (
    <ul className="divide-y divide-gray-100">
      {rows.map((c) => (
        <CategoryRow key={c.slug} category={c} onEdit={() => onEdit(c.slug)} onNotice={onNotice} />
      ))}
    </ul>
  );
}

function CategoryRow({ category: c, onEdit, onNotice }: { category: AdminCategoryRow; onEdit: () => void; onNotice: (msg: string) => void }) {
  const remove = useDeleteCategory();
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{c.name}</p>
        <p className="text-xs text-gray-500">
          Kod: {c.slug} · Sıra: {c.sortOrder}
        </p>
      </div>
      <Link href={`/urunler?kategori=${c.slug}`} target="_blank" className="text-xs text-gray-600 hover:text-brand-900 hover:underline">
        {c.productCount} ürün
      </Link>
      <IconButton label={`${c.name} düzenle`} onClick={onEdit}>
        <Pencil className="size-4" strokeWidth={SW} aria-hidden />
      </IconButton>
      <ConfirmDelete
        what={c.name}
        disabledReason={c.productCount > 0 ? `İçinde ${c.productCount} ürün var; önce ürünleri başka kategoriye taşıyın.` : undefined}
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => remove.mutate(c.slug, { onSuccess: () => onNotice(`"${c.name}" silindi.`) })}
      />
    </li>
  );
}

/* ---------- Formlar ---------- */

function GroupForm({
  group,
  onSaved,
  onCancel,
}: {
  group: AdminCategoryGroupRow | null;
  onSaved: (msg: string) => void;
  onCancel: () => void;
}) {
  const save = useSaveCategoryGroup();
  const [label, setLabel] = useState(group?.label ?? '');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState(group ? String(group.sortOrder) : '');
  const err = fieldErrors(save.error);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      {
        slug: group?.slug ?? null,
        input: { label: label.trim(), slug: group ? null : slug.trim() || null, sortOrder: toInt(sortOrder) },
      },
      { onSuccess: () => onSaved(group ? `"${label.trim()}" güncellendi.` : `"${label.trim()}" eklendi.`) },
    );
  };

  return (
    <FormShell onSubmit={onSubmit} onCancel={onCancel} pending={save.isPending} error={err.general}>
      <Field label="Ad *" error={err.label}>
        <input className="form-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ör. Kapı ve Pencere" autoFocus />
      </Field>
      {group ? (
        <p className="text-xs text-gray-500">Kod: {group.slug} (adres çubuğunda kullanıldığı için değiştirilemez)</p>
      ) : (
        <Field label="Kod" hint="Boş bırakılırsa addan üretilir (ör. kapi-ve-pencere). Sonradan değiştirilemez." error={err.slug}>
          <input className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="otomatik" />
        </Field>
      )}
      <Field label="Sıra" hint="Menüde küçük sayı önce gelir. Boşsa en sona eklenir." error={err.sortOrder}>
        <input className="form-input w-32" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
      </Field>
    </FormShell>
  );
}

function CategoryForm({
  data,
  category,
  presetGroup,
  onSaved,
  onCancel,
}: {
  data: AdminCategoryList;
  category: AdminCategoryRow | null;
  presetGroup?: string;
  onSaved: (msg: string) => void;
  onCancel: () => void;
}) {
  const save = useSaveCategory();
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : '');
  const [groups, setGroups] = useState<string[]>(category?.groups ?? (presetGroup ? [presetGroup] : []));
  const err = fieldErrors(save.error);

  const toggle = (g: string) => setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      {
        slug: category?.slug ?? null,
        input: { name: name.trim(), slug: category ? null : slug.trim() || null, sortOrder: toInt(sortOrder), groups },
      },
      { onSuccess: () => onSaved(category ? `"${name.trim()}" güncellendi.` : `"${name.trim()}" eklendi.`) },
    );
  };

  return (
    <FormShell onSubmit={onSubmit} onCancel={onCancel} pending={save.isPending} error={err.general}>
      <Field label="Ad *" error={err.name}>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. İç Cephe Boyası" autoFocus />
      </Field>
      {category ? (
        <p className="text-xs text-gray-500">
          Kod: {category.slug} · {category.productCount} ürün (kod değiştirilemez)
        </p>
      ) : (
        <Field label="Kod" hint="Boş bırakılırsa addan üretilir (ör. ic-cephe-boyasi). Sonradan değiştirilemez." error={err.slug}>
          <input className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="otomatik" />
        </Field>
      )}
      <Field label="Sıra" hint="Küçük sayı önce gelir. Boşsa en sona eklenir." error={err.sortOrder}>
        <input className="form-input w-32" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
      </Field>

      <fieldset>
        <legend className="form-label">Üst kategoriler</legend>
        {data.groups.length === 0 ? (
          <p className="text-xs text-gray-500">Henüz üst kategori yok; bu alt kategori menüde tek başına görünür.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.groups.map((g) => (
              <label key={g.slug} className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm hover:border-brand-700">
                <input type="checkbox" checked={groups.includes(g.slug)} onChange={() => toggle(g.slug)} className="size-4 accent-brand-900" />
                {g.label}
              </label>
            ))}
          </div>
        )}
        {err.groups && <span className="form-error block">{err.groups}</span>}
        <p className="mt-1 text-xs text-gray-500">Hiçbiri seçilmezse menüde tek başına başlık olarak görünür.</p>
      </fieldset>
    </FormShell>
  );
}

/* ---------- Küçük parçalar ---------- */

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label={title} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md hover:bg-gray-100" aria-label="Kapat">
            <X className="size-5" strokeWidth={SW} aria-hidden />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

function FormShell({
  onSubmit,
  onCancel,
  pending,
  error,
  children,
}: {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  pending: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {error && (
          <p role="alert" className="rounded border border-sale/30 bg-red-50 px-3 py-2 text-xs text-sale">
            {error}
          </p>
        )}
        {children}
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
        <button type="button" onClick={onCancel} className="h-10 rounded border border-gray-300 px-4 text-sm font-semibold hover:bg-gray-50">
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 items-center gap-2 rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Kaydet
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      {children}
      {error ? <span className="form-error block">{error}</span> : hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid size-8 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-brand-900">
      {children}
    </button>
  );
}

/** Sil butonu → satır içinde "Silinsin mi? Evet / Vazgeç" */
function ConfirmDelete({
  what,
  hint,
  disabledReason,
  pending,
  error,
  onConfirm,
}: {
  what: string;
  hint?: string;
  disabledReason?: string;
  pending: boolean;
  error?: string;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        aria-label={`${what} sil`}
        className="grid size-8 place-items-center rounded text-gray-500 hover:bg-red-50 hover:text-sale"
      >
        <Trash2 className="size-4" strokeWidth={SW} aria-hidden />
      </button>
    );
  }

  return (
    <div className="flex basis-full flex-wrap items-center justify-end gap-2 text-xs sm:basis-auto">
      <span className={error || disabledReason ? 'text-sale' : 'text-gray-600'}>
        {error ?? disabledReason ?? `"${what}" silinsin mi?${hint ? ` ${hint}` : ''}`}
      </span>
      {!disabledReason && (
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="h-8 rounded bg-sale px-3 font-semibold text-white disabled:opacity-70"
        >
          {pending ? 'Siliniyor…' : 'Evet, sil'}
        </button>
      )}
      <button type="button" onClick={() => setAsking(false)} className="h-8 rounded border border-gray-300 px-3 font-semibold">
        {disabledReason ? 'Tamam' : 'Vazgeç'}
      </button>
    </div>
  );
}

function toInt(s: string): number | null {
  const n = Number.parseInt(s.trim(), 10);
  return Number.isFinite(n) ? n : null;
}

/** Sunucu hataları: alan bazlı (slug, name ...) + genel mesaj */
function fieldErrors(error: Error | null): Record<string, string | undefined> & { general?: string } {
  if (!error) return {};
  if (error instanceof ApiError && Object.keys(error.fields).length) {
    return Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0]]));
  }
  return { general: error.message };
}
