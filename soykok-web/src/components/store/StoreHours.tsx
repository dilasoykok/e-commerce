'use client';

import { useEffect, useState } from 'react';
import { DAY_NAMES, DISPLAY_ORDER, nowInIstanbul, storeStatus, type WeeklyHours } from '@/lib/store-info';

/**
 * Çalışma saatleri tablosu + "Şu an açık/kapalı" rozeti (eski store-hours.js).
 * Saat tarayıcıda hesaplanır (sunucuda çizilen sayfa önbellekte eskiyebilir);
 * ilk çizimde rozet yok, bugünün satırı vurgusuz — sonra her dakika güncellenir.
 */
export default function StoreHours({ hours }: { hours: WeeklyHours }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = now ? nowInIstanbul(now).day : -1;
  const status = now ? storeStatus(hours, now) : null;

  return (
    <>
      <span
        aria-live="polite"
        className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
          !status ? 'invisible' : status.open ? 'bg-green-50 text-green-700' : 'bg-red-50 text-sale'
        }`}
      >
        <span className="size-2 rounded-full bg-current" />
        {status?.text ?? '—'}
      </span>

      <table className="mt-3 w-full text-sm">
        <tbody>
          {DISPLAY_ORDER.map((d) => {
            const h = hours[d];
            const isToday = d === today;
            return (
              <tr key={d} className={isToday ? 'bg-wood-500/10 font-semibold' : ''}>
                <td className={`rounded-l px-2 py-1.5 ${isToday ? 'text-brand-900' : 'text-gray-600'}`}>
                  {DAY_NAMES[d]}
                  {isToday && <span className="ml-1 text-[10px] font-medium text-wood-600">(Bugün)</span>}
                </td>
                <td className={`rounded-r px-2 py-1.5 text-right font-medium ${h ? '' : 'text-sale'}`}>
                  {h ? `${h[0]} – ${h[1]}` : 'Kapalı'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
