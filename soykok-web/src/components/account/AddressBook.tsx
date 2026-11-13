'use client';

import { useState } from 'react';
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';

import AddressForm, { formatPhone } from './AddressForm';
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useMakeDefaultAddress,
  useUpdateAddress,
} from '@/hooks/useAddresses';
import { useProfile } from '@/hooks/useProfile';
import type { SavedAddress } from '@/lib/types';

const SW = 1.75;
const MAX = 10;

/** Hesabım → Adreslerim: kayıtlı adresler, ekle / düzenle / sil / varsayılan yap */
export default function AddressBook() {
  const list = useAddresses();
  const profile = useProfile().data;
  const create = useCreateAddress();
  const update = useUpdateAddress();
  // null: form kapalı · 'new': yeni adres · id: o adres düzenleniyor
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  if (list.isPending)
    return (
      <p className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Adresleriniz yükleniyor…
      </p>
    );
  if (list.isError)
    return (
      <p role="alert" className="rounded border border-sale/30 bg-red-50 px-4 py-3 text-sm text-sale">
        Adresleriniz şu an yüklenemedi. Sayfayı yenileyip tekrar deneyin.
      </p>
    );

  const addresses = list.data;
  const editingAddress = addresses.find((a) => a.id === editing);
  const done = (message: string) => {
    setEditing(null);
    setStatus(message);
  };

  return (
    <div>
      <p className="sr-only" role="status">
        {status}
      </p>

      {editing ? (
        <AddressForm
          key={editing}
          initial={editingAddress}
          defaultRecipient={profile ? `${profile.firstName} ${profile.lastName}`.trim() : ''}
          defaultPhone={profile?.phone ? formatPhone(profile.phone) : ''}
          busy={create.isPending || update.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={async (input) => {
            if (editingAddress) await update.mutateAsync({ id: editingAddress.id, input });
            else await create.mutateAsync(input);
            done(editingAddress ? 'Adres güncellendi.' : 'Adres eklendi.');
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {addresses.length === 0
                ? 'Henüz kayıtlı adresiniz yok. Adres eklerseniz ödeme sırasında tek tıkla seçebilirsiniz.'
                : `${addresses.length} kayıtlı adres`}
            </p>
            {addresses.length < MAX && (
              <button type="button" onClick={() => setEditing('new')}
                className="inline-flex h-10 items-center gap-2 rounded bg-brand-900 px-4 text-sm font-semibold text-white hover:bg-brand-700">
                <Plus className="size-4" strokeWidth={SW} aria-hidden /> Yeni adres ekle
              </button>
            )}
          </div>

          {addresses.length > 0 && (
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {addresses.map((a) => (
                <li key={a.id}>
                  <AddressCard address={a} onEdit={() => setEditing(a.id)} onStatus={setStatus} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function AddressCard({
  address: a,
  onEdit,
  onStatus,
}: {
  address: SavedAddress;
  onEdit: () => void;
  onStatus: (message: string) => void;
}) {
  const remove = useDeleteAddress();
  const makeDefault = useMakeDefaultAddress();
  const [confirming, setConfirming] = useState(false);
  const error = remove.error ?? makeDefault.error;

  return (
    <article className={`flex h-full flex-col rounded-md border p-4 text-sm ${a.isDefault ? 'border-brand-900' : 'border-gray-200'}`}>
      <header className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold">
          <MapPin className="size-4 text-brand-700" strokeWidth={SW} aria-hidden /> {a.title}
        </h3>
        {a.isDefault && <span className="rounded bg-brand-900 px-2 py-0.5 text-xs font-semibold text-white">Varsayılan</span>}
      </header>

      <div className="mt-2 flex-1 text-gray-700">
        <p className="font-medium text-gray-900">{a.recipientName}</p>
        <p>{formatPhone(a.phone)}</p>
        <p className="mt-1">{a.line}</p>
        <p>
          {a.district} / {a.city}
          {a.postalCode && ` ${a.postalCode}`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-xs font-semibold">
        <button type="button" onClick={onEdit} className="inline-flex min-h-6 items-center gap-1.5 hover:text-wood-600">
          <Pencil className="size-3.5" strokeWidth={SW} aria-hidden /> Düzenle<span className="sr-only">: {a.title}</span>
        </button>
        {!a.isDefault && (
          <button type="button" disabled={makeDefault.isPending}
            onClick={() => makeDefault.mutate(a.id, { onSuccess: () => onStatus(`${a.title} varsayılan adres yapıldı.`) })}
            className="inline-flex min-h-6 items-center gap-1.5 hover:text-wood-600 disabled:opacity-60">
            <Star className="size-3.5" strokeWidth={SW} aria-hidden /> Varsayılan yap<span className="sr-only">: {a.title}</span>
          </button>
        )}
        {confirming ? (
          <span className="inline-flex items-center gap-2">
            <span className="font-normal text-gray-600">Silinsin mi?</span>
            <button type="button" disabled={remove.isPending}
              onClick={() => remove.mutate(a.id, { onSuccess: () => onStatus(`${a.title} silindi.`) })}
              className="min-h-6 rounded bg-sale px-2 text-white disabled:opacity-60">
              {remove.isPending ? 'Siliniyor…' : 'Evet, sil'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="min-h-6 px-1 hover:underline">
              Vazgeç
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}
            className="ml-auto inline-flex min-h-6 items-center gap-1.5 text-gray-600 hover:text-sale">
            <Trash2 className="size-3.5" strokeWidth={SW} aria-hidden /> Sil<span className="sr-only">: {a.title}</span>
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-sale">{error.message}</p>}
    </article>
  );
}
