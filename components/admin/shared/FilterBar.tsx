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

const TRIGGER_CLASS = 'h-10 cursor-pointer rounded-full border-[1.5px] border-gf-line bg-white pl-3.5 text-sm';

function formatDate(d: Date | null, locale: 'th' | 'en'): string {
  if (!d) return translateText(locale, 'Pick date');
  return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FilterBar({ search, selects, dateRange, actions }: FilterBarProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="flex items-center gap-[12px] flex-wrap [margin-bottom:20px]">
      {search && (
        <div className="bg-gf-pink-100 rounded-full flex items-center gap-[10px] [padding:10px_18px] text-gf-muted text-[14px] min-w-[240px]">
          <Search size={16} />
          <input
            placeholder={translateText(locale, search.placeholder)}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="bg-transparent border-0 outline-none flex-1"
          />
        </div>
      )}

      {selects?.map((sel) => (
        <Select key={sel.label} value={sel.value} onValueChange={(v) => sel.onChange(v ?? '')}>
          <SelectTrigger className={TRIGGER_CLASS}>
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

      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  );
}
