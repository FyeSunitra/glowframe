'use client';

import { cn } from '@/lib/utils';

interface PillTabsProps<T extends string> {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

export function PillTabs<T extends string>({ items, value, onChange }: PillTabsProps<T>) {
  return (
    <div className="mb-[22px] flex w-fit rounded-full bg-gf-pink-100 p-1.5">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            'cursor-pointer rounded-full border-0 px-5 py-2.5 text-sm font-semibold',
            value === item ? 'bg-gf-pink-500 text-gf-brown-900' : 'bg-transparent text-gf-brown-700',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
