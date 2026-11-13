import { MapPin } from 'lucide-react';
import { STORE, hoursSummary } from '@/lib/store-info';

/** Mağazadan teslimde müşteriye adres, çalışma saatleri ve yol tarifi */
export default function StorePickupInfo({ className = '' }: { className?: string }) {
  return (
    <div className={`text-xs text-gray-600 ${className}`}>
      <p>
        {STORE.addressLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <p className="mt-1">{hoursSummary().join(' · ')}</p>
      <p className="mt-1">
        Telefon:{' '}
        <a href={STORE.phoneHref} className="font-semibold underline">
          {STORE.phone}
        </a>
      </p>
      <a
        href={STORE.directionsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex min-h-6 items-center gap-1 font-semibold text-brand-900 underline"
      >
        <MapPin className="size-3.5" strokeWidth={1.75} aria-hidden /> Yol tarifi al
        <span className="sr-only"> (yeni sekmede açılır)</span>
      </a>
    </div>
  );
}
