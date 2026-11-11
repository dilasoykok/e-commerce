'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import ProductForm from './ProductForm';
import { useCategories, useDeleteProduct, useProducts } from '@/hooks/useCatalog';
import { formatTL } from '@/lib/format';
import type { Product } from '@/lib/types';
import { productImageSrc } from '@/lib/product-image';

const PAGE_SIZE = 20;
const SW = 1.75;

/**
 * /admin/urunler — ürün listesi + ekle / düzenle / sil.
 * Veri: TanStack Query (hooks/useCatalog.ts). Her değişiklikten sonra liste
 * ve sitedeki ürün önbelleği kendiliğinden yenilenir.
 */
export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState(''); // yazmayı bitirince (300 ms) aranır
  const [kategori, setKategori] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | null | undefined>(undefined); // undefined: kapalı, null: yeni
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const categories = useCategories();
  const products = useProducts({ q, kategori, page, pageSize: PAGE_SIZE });
  const categoryName = (slug: string) => categories.data?.categories.find((c) => c.slug === slug)?.name ?? slug;

  const total = products.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Ürünler</h1>
          <p className="mt-1 text-sm text-gray-500">
            {products.data ? `${total} ürün` : 'Yükleniyor…'}
            {products.isFetching && products.data && <Loader2 className="ml-2 inline size-3.5 animate-spin" aria-hidden />}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="flex h-10 items-center gap-2 rounded bg-brand-900 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="size-4" strokeWidth={SW} aria-hidden /> Yeni Ürün
        </button>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {notice}
        </p>
      )}

      {/* Filtreler */}
      <div className="mt-5 flex flex-wrap gap-3">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Ara</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500" strokeWidth={SW} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün adı, marka veya kategori"
            className="form-input pl-9"
          />
        </label>
        <label>
          <span className="sr-only">Kategori</span>
          <select
            value={kategori}
            onChange={(e) => {
              setKategori(e.target.value);
              setPage(1);
            }}
            className="form-input w-56"
          >
            <option value="">Tüm kategoriler</option>
            {categories.data?.groups.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.label} (tümü)
              </option>
            ))}
            {categories.data?.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Tablo */}
      <div className="mt-4 overflow-x-auto rounded-md border border-gray-200">
        {products.isError ? (
          <p className="p-6 text-sm text-sale">{products.error.message}</p>
        ) : products.isPending ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-gray-500" aria-label="Yükleniyor" />
          </div>
        ) : products.data.items.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Ürün bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Ürün</th>
                <th className="px-4 py-2.5 font-medium">Kategori</th>
                <th className="px-4 py-2.5 text-right font-medium">Fiyat</th>
                <th className="px-4 py-2.5 text-right font-medium">Stok</th>
                <th className="px-4 py-2.5 text-right font-medium">Satış</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.data.items.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  categoryName={categoryName(p.category)}
                  onEdit={() => setEditing(p.id)}
                  onDeleted={() => setNotice(`"${p.name}" silindi.`)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sayfalama */}
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="grid size-9 place-items-center rounded border border-gray-300 disabled:opacity-40"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="size-4" strokeWidth={SW} aria-hidden />
          </button>
          <span className="px-2 text-gray-600">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
            className="grid size-9 place-items-center rounded border border-gray-300 disabled:opacity-40"
            aria-label="Sonraki sayfa"
          >
            <ChevronRight className="size-4" strokeWidth={SW} aria-hidden />
          </button>
        </div>
      )}

      {editing !== undefined && (
        <ProductForm
          productId={editing}
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            setEditing(undefined);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}

function ProductRow({
  product: p,
  categoryName,
  onEdit,
  onDeleted,
}: {
  product: Product;
  categoryName: string;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteProduct();

  return (
    <tr className="align-middle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={productImageSrc(p.image)} alt="" className="h-10 w-14 shrink-0 rounded bg-gray-100 object-cover" />
          <div className="min-w-0">
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-gray-500">
              {p.id} · {p.brand}
              {p.badge && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">{p.badge}</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">{categoryName}</td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {p.oldPrice && <del className="mr-2 text-xs text-gray-500">{formatTL(p.oldPrice)}</del>}
        <span className="font-semibold">{formatTL(p.price)}</span>
        <span className="text-xs text-gray-500">/{p.unit || 'm²'}</span>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {p.stock == null ? (
          <span className="text-xs text-gray-500" title="Stok takibi yok">—</span>
        ) : p.stock === 0 ? (
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-sale">Tükendi</span>
        ) : (
          <span className={p.stock <= 10 ? 'font-semibold text-amber-600' : 'text-gray-700'}>{p.stock}</span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-gray-600">{p.sales}</td>
      <td className="px-4 py-3">
        {confirming ? (
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            <span className="text-xs text-gray-600">{remove.isError ? (remove.error?.message ?? 'Silinemedi.') : 'Silinsin mi?'}</span>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(p.id, { onSuccess: onDeleted })}
              className="h-8 rounded bg-sale px-3 text-xs font-semibold text-white disabled:opacity-60"
            >
              {remove.isPending ? 'Siliniyor…' : 'Evet, sil'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="h-8 rounded px-2 text-xs hover:bg-gray-100">
              Vazgeç
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/urun/${encodeURIComponent(p.id)}`}
              target="_blank"
              className="grid size-8 place-items-center rounded text-gray-500 hover:bg-gray-100"
              aria-label={`${p.name} sitede gör`}
            >
              <ExternalLink className="size-4" strokeWidth={SW} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={onEdit}
              className="grid size-8 place-items-center rounded text-gray-500 hover:bg-gray-100"
              aria-label={`${p.name} düzenle`}
            >
              <Pencil className="size-4" strokeWidth={SW} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="grid size-8 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-sale"
              aria-label={`${p.name} sil`}
            >
              <Trash2 className="size-4" strokeWidth={SW} aria-hidden />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
