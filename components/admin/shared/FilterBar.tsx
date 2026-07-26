'use client';

import type { ReactNode } from 'react';
import { Search, Calendar } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

interface SearchConfig {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}

interface SelectConfig {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

interface DateRangeConfig {
  fromValue: Date | null;
  toValue: Date | null;
  onFromChange: (d: Date | undefined) => void;
  onToChange: (d: Date | undefined) => void;
}

interface FilterBarProps {
  search?: SearchConfig;
  selects?: SelectConfig[];
  dateRange?: DateRangeConfig;
  actions?: ReactNode;
}

const TRIGGER_CLASS = 'h-[42px] w-full cursor-pointer rounded-[14px] border-[1.5px] border-gf-line bg-white pl-3.5 text-sm sm:min-w-[170px] sm:flex-1';

function formatDate(d: Date | null, locale: 'th' | 'en'): string {
  if (!d) return translateText(locale, 'Pick date');
  return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FilterBar({ search, selects, dateRange, actions }: FilterBarProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-3 [margin-bottom:20px] sm:flex-row sm:flex-wrap sm:items-center">
      {search && (
        <div className="flex h-[42px] w-full items-center gap-2.5 rounded-[14px] border-[1.5px] border-gf-line bg-white px-[18px] text-[14px] text-gf-muted sm:min-w-[240px] sm:flex-[2]">
          <Search className="shrink-0" size={16} />
          <input
            placeholder={translateText(locale, search.placeholder)}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent outline-none"
          />
        </div>
      )}

      {selects?.map((sel) => (
        <Select key={sel.label} value={sel.value} onValueChange={(v) => sel.onChange(v ?? '')}>
          <SelectTrigger className="w-full sm:min-w-[170px] sm:flex-1">
            <SelectValue placeholder={translateText(locale, sel.label)} />
          </SelectTrigger>
          <SelectContent>
            {sel.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{translateText(locale, opt.label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {dateRange && (
        <>
          <Popover>
            <PopoverTrigger className={`${TRIGGER_CLASS} flex items-center gap-1.5 px-3.5`}>
              <Calendar size={14} />
              <span className="text-[14px]">{formatDate(dateRange.fromValue, locale)}</span>
            </PopoverTrigger>
            <PopoverContent className="[padding:0] w-[auto]">
              <CalendarUI
                mode="single"
                selected={dateRange.fromValue ?? undefined}
                onSelect={dateRange.onFromChange}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger className={`${TRIGGER_CLASS} flex items-center gap-1.5 px-3.5`}>
              <Calendar size={14} />
              <span className="text-[14px]">{formatDate(dateRange.toValue, locale)}</span>
            </PopoverTrigger>
            <PopoverContent className="[padding:0] w-[auto]">
              <CalendarUI
                mode="single"
                selected={dateRange.toValue ?? undefined}
                onSelect={dateRange.onToChange}
              />
            </PopoverContent>
          </Popover>
        </>
      )}

      {actions && <div className="w-full sm:ml-auto sm:w-auto">{actions}</div>}
    </div>
  );
}
