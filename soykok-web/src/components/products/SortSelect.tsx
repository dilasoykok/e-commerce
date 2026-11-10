'use client';

import { ChevronDown } from 'lucide-react';
import { SORTS, type Sort } from '@/lib/product-filters';
import { useListNavigation } from './ListNavigation';

export default function SortSelect() {
  const { state, navigate } = useListNavigation();

  return (
    <div className="relative flex-1 sm:flex-none">
      <label htmlFor="sortSelect" className="sr-only">
        Sırala
      </label>
      <select
        id="sortSelect"
        value={state.sort}
        onChange={(e) => navigate({ sort: e.target.value as Sort })}
        className="h-10 w-full cursor-pointer appearance-none rounded border border-gray-300 bg-white pr-9 pl-3 text-sm focus:border-brand-700 focus:outline-none sm:w-60"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-500"
        strokeWidth={1.75}
        aria-hidden
      />
    </div>
  );
}
