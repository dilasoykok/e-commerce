'use client';

import { CreditCard } from 'lucide-react';
import { useInstallments } from '@/hooks/useInstallments';
import { formatTL } from '@/lib/format';
import type { InstallmentInfo } from '@/lib/types';

/** "Peşin fiyatına 3 taksit · 9 taksite varan seçenekler" — veri yoksa hiçbir şey göstermez */
export function installmentSummary(info: InstallmentInfo | undefined): string | null {
  if (!info?.enabled || info.cards.length === 0 || info.maxInstallments <= 1) return null;
  const parts: string[] = [];
  if (info.interestFreeInstallments > 1) parts.push(`Peşin fiyatına ${info.interestFreeInstallments} taksit`);
  if (info.maxInstallments > info.interestFreeInstallments) parts.push(`${info.maxInstallments} taksite varan seçenekler`);
  return parts.join(' · ');
}

/** Ürün sayfasında fiyatın altındaki kısa satır + taksit sekmesine bağlantı */
export function InstallmentHint({ price, className = '' }: { price: number; className?: string }) {
  const { data } = useInstallments(price);
  const text = installmentSummary(data);
  if (!text) return null;
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-700 ${className}`}>
      <CreditCard className="size-4 shrink-0 text-brand-700" strokeWidth={1.75} aria-hidden />
      <span>{text}</span>
      <a href="#taksit-secenekleri" className="font-semibold text-brand-900 underline underline-offset-2">
        Taksit tablosu
      </a>
    </p>
  );
}

/**
 * Taksit tablosu: satırlar taksit sayısı, sütunlar kart aileleri (Bonus, World, Maximum ...).
 * Dar ekranda yatay kaydırılır; ilk sütun sabit kalır.
 */
export function InstallmentTable({ price }: { price: number }) {
  const { data, isPending, isError } = useInstallments(price);

  if (isPending) return <p className="text-sm text-gray-500">Taksit seçenekleri yükleniyor…</p>;
  if (isError || !data?.enabled || data.cards.length === 0)
    return (
      <p className="text-sm text-gray-600">
        Taksit seçenekleri şu an gösterilemiyor. Kartla ödemede, ödeme ekranında kartınıza uygun taksitleri görebilirsiniz.
      </p>
    );

  const counts = [...new Set(data.cards.flatMap((c) => c.prices.map((p) => p.count)))].sort((a, b) => a - b);

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-gray-200" tabIndex={0} role="region" aria-labelledby="installmentCaption">
        <table className="w-full min-w-max border-collapse text-sm">
          <caption id="installmentCaption" className="sr-only">
            {formatTL(data.price)} için kartlara göre taksit seçenekleri: aylık tutar ve toplam
          </caption>
          <thead>
            <tr className="bg-gray-50 text-left">
              <th scope="col" className="sticky left-0 bg-gray-50 px-3 py-2.5 font-semibold">
                Taksit
              </th>
              {data.cards.map((c) => (
                <th key={c.cardFamily} scope="col" className="px-3 py-2.5 font-semibold">
                  {c.cardFamily}
                  {c.bankName && <span className="block text-xs font-normal text-gray-600">{c.bankName}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {counts.map((n) => (
              <tr key={n} className="border-t border-gray-100">
                <th scope="row" className="sticky left-0 bg-white px-3 py-2.5 text-left font-semibold">
                  {n === 1 ? 'Tek çekim' : `${n} taksit`}
                </th>
                {data.cards.map((c) => {
                  const p = c.prices.find((x) => x.count === n);
                  return (
                    <td key={c.cardFamily} className="px-3 py-2.5 align-top whitespace-nowrap">
                      {p ? (
                        <>
                          <span className="font-semibold">{n === 1 ? formatTL(p.total) : `${n} × ${formatTL(p.monthly)}`}</span>
                          {n > 1 && <span className="block text-xs text-gray-600">Toplam {formatTL(p.total)}</span>}
                        </>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-600">
        Tutarlar 1 adet için hesaplanmıştır; sepetinizin toplamına göre ödeme ekranında yeniden hesaplanır. Taksit seçimi
        iyzico güvenli ödeme ekranında yapılır. Banka kartlarında taksit yapılamaz.
      </p>
    </div>
  );
}
