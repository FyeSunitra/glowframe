'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, MailCheck, Truck } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { th, enUS } from 'date-fns/locale';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CameraGlyph } from '@/components/common/CameraGlyph';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { useAppStore } from '@/store/appStore';
import { unwrapApiResponse } from '@/lib/api';
import { cn, money } from '@/lib/utils';
import type { DayOption, DeliveryOption, Product } from '@/types';
import { getPageText } from '@/lib/menuI18n';
import { productService } from '@/services/products';

const MIN_LEAD_DAYS = 5;

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function parseDateKey(key?: string): Date | undefined {
  if (!key) return undefined;
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rentalDays(from?: Date, to?: Date): number {
  if (!from || !to) return 0;
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((toUtc - fromUtc) / 86_400_000) + 1;
}

function rangeContainsUnavailable(from: Date, to: Date, unavailable: Set<string>): boolean {
  for (let current = new Date(from); current <= to; current = addCalendarDays(current, 1)) {
    if (unavailable.has(toDateKey(current))) return true;
  }
  return false;
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const t = getPageText(locale, 'booking');
  const { booking, setBooking, resetTxnPay, user } = useAppStore((state) => ({
    booking: state.booking,
    setBooking: state.setBooking,
    resetTxnPay: state.resetTxnPay,
    user: state.user,
  }));
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const { data: product } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => unwrapApiResponse(await productService.get(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    const productId = Number(id);
    if (booking.productId === productId) return;
    setBooking({
      productId,
      startDate: undefined,
      endDate: undefined,
      days: undefined,
      total: undefined,
    });
  }, [booking.productId, id, setBooking]);

  useEffect(() => {
    function closeCalendar(event: MouseEvent) {
      if (calRef.current && !calRef.current.contains(event.target as Node)) {
        setCalOpen(false);
      }
    }

    document.addEventListener('mousedown', closeCalendar);
    return () => document.removeEventListener('mousedown', closeCalendar);
  }, []);

  const minStartDate = useMemo(
    () => addCalendarDays(startOfToday(), MIN_LEAD_DAYS),
    [],
  );
  const unavailableDates = useMemo(
    () => new Set(product?.unavailableDates ?? []),
    [product?.unavailableDates],
  );
  const disabledDates = useMemo(
    () => Array.from(unavailableDates, (key) => parseDateKey(key)).filter(
      (date): date is Date => Boolean(date),
    ),
    [unavailableDates],
  );

  if (!product) {
    return <div className="p-[60px] text-gf-muted">{t.loading}</div>;
  }

  const selectedRange: DateRange | undefined = booking.startDate
    ? {
        from: parseDateKey(booking.startDate),
        to: parseDateKey(booking.endDate),
    }
    : undefined;
  const days = rentalDays(selectedRange?.from, selectedRange?.to);
  const verificationBlocked = !user.emailVerified || user.suspended;
  const hasUnavailableDate = Boolean(
    selectedRange?.from
      && selectedRange.to
      && rangeContainsUnavailable(selectedRange.from, selectedRange.to, unavailableDates),
  );
  const canContinue = days > 0 && !hasUnavailableDate && !verificationBlocked;
  const mainImage = product.media?.find((item) => item.mediaType === 'image');
  const dayOptions: { key: DayOption; label: string; dayCount: number | null }[] = [
    { key: '1', label: t.oneDay, dayCount: 1 },
    { key: '3', label: t.threeDays, dayCount: 3 },
    { key: '5', label: t.fiveDays, dayCount: 5 },
    { key: 'custom', label: t.customDays, dayCount: null },
  ];
  const deliveryOptions: { key: DeliveryOption; label: string }[] = [
    { key: 'pickup', label: t.pickup },
    { key: 'grab', label: t.messenger },
    { key: 'post', label: t.shipping },
  ];
  const dateFormatter = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  function handleRangeChange(range: DateRange | undefined) {
    if (!range?.from) {
      setBooking({ startDate: undefined, endDate: undefined, days: undefined });
      return;
    }

    const nextDays = rentalDays(range.from, range.to);
    setBooking({
      startDate: toDateKey(range.from),
      endDate: range.to ? toDateKey(range.to) : undefined,
      days: nextDays || undefined,
    });
    if (range.to) setCalOpen(false);
  }

  function handleStartDateChange(date: Date | undefined) {
    if (!date) {
      setBooking({ startDate: undefined, endDate: undefined, days: undefined });
      return;
    }

    const nextDays = Number(booking.dayOption);
    const endDate = addCalendarDays(date, nextDays - 1);
    if (rangeContainsUnavailable(date, endDate, unavailableDates)) return;

    setBooking({
      startDate: toDateKey(date),
      endDate: toDateKey(endDate),
      days: nextDays,
    });
    setCalOpen(false);
  }

  function changeDayOption(dayOption: DayOption) {
    setBooking({
      dayOption,
      startDate: undefined,
      endDate: undefined,
      days: undefined,
      total: undefined,
    });
    setCalOpen(false);
  }

  function goTransaction() {
    if (verificationBlocked) {
      router.push('/account/security');
      return;
    }
    if (!canContinue || !selectedRange?.from || !selectedRange.to) return;

    resetTxnPay();
    setBooking({
      startDate: toDateKey(selectedRange.from),
      endDate: toDateKey(selectedRange.to),
      days,
      paymentStatus: 'not_started',
      paymentProofName: undefined,
    });
    router.push('/transaction');
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.forRent, product.name]} />

      {verificationBlocked && (
        <div className="mb-5 flex items-center gap-3 rounded-[22px] bg-gf-pink-100 p-[18px] [box-shadow:var(--gf-shadow-sm)]">
          <MailCheck size={22} className="shrink-0 text-gf-brown-700" />
          <div className="flex-1 text-[13.5px] leading-relaxed text-gf-brown-700">
            {t.emailRequired}
          </div>
          <button
            onClick={() => router.push('/account/security')}
            className="cursor-pointer rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-4 py-[9px] text-[13px] font-semibold text-gf-brown-800"
          >
            {t.reviewAccount}
          </button>
        </div>
      )}

      <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-[26px] max-[900px]:grid-cols-1">
        <div className="rounded-[8px] bg-gf-pink-100 p-[26px] text-center">
          <div className="mb-4 rounded-[14px] bg-white p-3 text-[13.5px] font-bold [box-shadow:var(--gf-shadow-sm)]">
            {product.name}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-white">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 300px"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <CameraGlyph color={product.color} size={100} />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[22px] bg-white p-7 [box-shadow:var(--gf-shadow)] max-[520px]:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[19px] font-bold text-gf-brown-900">{t.duration}</div>
            <div ref={calRef} className="relative">
              <button
                type="button"
                onClick={() => setCalOpen((open) => !open)}
                className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[12px] font-semibold text-gf-brown-700 underline"
              >
                {selectedRange?.from
                  ? selectedRange.to
                    ? `${dateFormatter.format(selectedRange.from)} - ${dateFormatter.format(selectedRange.to)}`
                    : dateFormatter.format(selectedRange.from)
                  : t.chooseDate}
                <CalendarIcon size={15} />
              </button>

              {calOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 rounded-[16px] border border-gf-line bg-white p-2 [box-shadow:var(--gf-shadow)] max-[520px]:fixed max-[520px]:inset-x-4 max-[520px]:top-1/2 max-[520px]:-translate-y-1/2">
                  {booking.dayOption === 'custom' ? (
                    <CalendarUI
                      mode="range"
                      selected={selectedRange}
                      onSelect={handleRangeChange}
                      min={1}
                      defaultMonth={selectedRange?.from ?? minStartDate}
                      startMonth={minStartDate}
                      disabled={[{ before: minStartDate }, ...disabledDates]}
                      excludeDisabled
                      locale={locale === 'th' ? th : enUS}
                      className="mx-auto [--cell-size:38px]"
                    />
                  ) : (
                    <CalendarUI
                      mode="single"
                      selected={selectedRange?.from}
                      onSelect={handleStartDateChange}
                      defaultMonth={selectedRange?.from ?? minStartDate}
                      startMonth={minStartDate}
                      disabled={(date) => (
                        date < minStartDate
                        || rangeContainsUnavailable(
                          date,
                          addCalendarDays(date, Number(booking.dayOption) - 1),
                          unavailableDates,
                        )
                      )}
                      locale={locale === 'th' ? th : enUS}
                      className="mx-auto [--cell-size:38px]"
                    />
                  )}
                  <div className="px-2 pb-2 text-[11.5px] leading-relaxed text-gf-muted">
                    {t.dateRule}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            {dayOptions.map((option) => {
              const optionDays = option.dayCount ?? days;
              const optionPrice = optionDays > 0 ? product.price * optionDays : null;
              const customSelectedDays = option.key === 'custom' && booking.dayOption === 'custom' && days > 0;

              return (
                <div
                  key={option.key}
                  onClick={() => changeDayOption(option.key)}
                  className={cn(
                    'mb-2.5 flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-[13px] text-sm',
                    booking.dayOption === option.key
                      ? 'border-gf-brown-800 bg-gf-pink-100'
                      : 'border-gf-line bg-transparent',
                  )}
                >
                  <div
                    className={cn(
                      'relative size-[18px] shrink-0 rounded-full border-2',
                      booking.dayOption === option.key
                        ? 'border-gf-brown-800'
                        : 'border-gf-brown-300',
                    )}
                  >
                    {booking.dayOption === option.key && (
                      <div className="absolute inset-[3px] rounded-full bg-gf-brown-800" />
                    )}
                  </div>
                  <div>
                    {optionPrice !== null ? (
                      <>
                        <span className="font-bold text-gf-brown-900">
                          {money(optionPrice)} THB
                        </span>{' '}
                        <span className="text-gf-muted">
                          / {customSelectedDays ? `${days} ${t.days}` : option.label}
                        </span>
                      </>
                    ) : (
                      option.label
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-[26px] flex items-center gap-2.5 text-[19px] font-bold text-gf-brown-900">
            {t.deliveryOption}
            <Truck size={18} />
          </div>
          <div className="mt-3">
            {deliveryOptions.map((option) => (
              <div
                key={option.key}
                onClick={() => setBooking({ delivery: option.key })}
                className={cn(
                  'mb-2.5 flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-[13px] text-sm',
                  booking.delivery === option.key
                    ? 'border-gf-brown-800 bg-gf-pink-100'
                    : 'border-gf-line bg-transparent',
                )}
              >
                <div
                  className={cn(
                    'relative size-[18px] shrink-0 rounded-full border-2',
                    booking.delivery === option.key
                      ? 'border-gf-brown-800'
                      : 'border-gf-brown-300',
                  )}
                >
                  {booking.delivery === option.key && (
                    <div className="absolute inset-[3px] rounded-full bg-gf-brown-800" />
                  )}
                </div>
                {option.label}
              </div>
            ))}
          </div>

          <div className="mt-3.5 rounded-[14px] bg-gf-pink-100 p-3.5 text-[13px] leading-relaxed text-gf-brown-700">
            {t.bookingRule}
          </div>

          <button
            onClick={goTransaction}
            disabled={!canContinue}
            className={cn(
              'mt-3.5 w-full rounded-full border-0 bg-gf-brown-800 px-[26px] py-[13px] text-[15px] font-semibold text-gf-pink-100',
              canContinue ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-45',
            )}
          >
            {t.continuePayment}
          </button>
        </div>
      </div>
    </div>
  );
}
