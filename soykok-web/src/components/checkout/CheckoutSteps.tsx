import Link from 'next/link';

const STEPS = [
  { label: 'Sepet', href: '/sepet' },
  { label: 'Teslimat ve Ödeme', href: '/odeme' },
  { label: 'Onay', href: null },
];

/** Sepet → Teslimat ve Ödeme → Onay adımları. current: 0'dan başlayan aktif adım */
export default function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs font-medium" aria-label="Sipariş adımları">
      {STEPS.map((s, i) => {
        const done = i < current || current === STEPS.length - 1;
        const active = i === current;
        return (
          <li key={s.label} className="flex items-center gap-2">
            {i > 0 && <span className={`h-px w-8 sm:w-16 ${i <= current ? 'bg-green-600' : 'bg-gray-300'}`} aria-hidden />}
            <span
              className={`flex items-center gap-2 ${done ? 'text-green-800' : active ? 'text-brand-900' : 'text-gray-500'}`}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={`grid size-6 place-items-center rounded-full ${
                  done ? 'bg-green-700 text-white' : active ? 'bg-brand-900 text-white' : 'border border-gray-300'
                }`}
                aria-hidden
              >
                {done ? '✓' : i + 1}
              </span>
              {done && s.href && i < current ? (
                <Link href={s.href} className="hover:underline">
                  {s.label}
                </Link>
              ) : (
                s.label
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
