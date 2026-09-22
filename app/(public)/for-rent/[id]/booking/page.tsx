'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar as CalendarIcon, MailCheck, MapPin, Plus, Truck } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { th, enUS } from 'date-fns/locale';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { LoadingState } from '@/components/common/LoadingState';
import { CameraGlyph } from '@/components/common/CameraGlyph';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore } from '@/store/appStore';
import { unwrapApiResponse } from '@/lib/api';
import { cn, money } from '@/lib/utils';
import type { DayOption, DeliveryOption, Product } from '@/types';
import { getPageText } from '@/lib/menuI18n';
import { productService } from '@/services/products';
import { bookingSettingsService } from '@/services/bookingSettings';
import { addressService } from '@/services/address';
import type { Address } from '@/types/address';

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
  return Math.floor((toUtc - fromUtc) / 86_400_000);
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
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  const { data: product } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => unwrapApiResponse(await productService.get(id)),
    enabled: !!id,
  });
  const { data: bookingSettings } = useQuery({
    queryKey: ['public', 'booking-settings'],
    queryFn: async () => unwrapApiResponse(await bookingSettingsService.get()),
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const { data: addresses = [], isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ['user', 'addresses', 'booking', user.id],
    queryFn: async () => unwrapApiResponse(await addressService.list()),
    enabled: Boolean(user.id && user.id > 0),
    staleTime: 0,
    refetchOnMount: 'always',
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
    if (addresses.length === 0) return;
    if (addresses.some((address) => address.id === booking.deliveryAddressId)) return;
    const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
    setBooking({ deliveryAddressId: defaultAddress.id });
  }, [addresses, booking.deliveryAddressId, setBooking]);

  const minAdvanceDays = bookingSettings?.minAdvanceDays ?? 5;
  const minStartDate = useMemo(
    () => addCalendarDays(startOfToday(), minAdvanceDays),
    [minAdvanceDays],
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
    return <LoadingState label={t.loading} className="p-[60px]" />;
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
  const selectedDeliveryAddress = addresses.find(
    (address) => address.id === booking.deliveryAddressId,
  );
  const canContinue = days > 0
    && !hasUnavailableDate
    && !verificationBlocked
    && addresses.length > 0
    && !!selectedDeliveryAddress;
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
  const bookingRule = t.bookingRule.replace('{days}', String(minAdvanceDays));
  const dateRule = t.dateRule.replace('{days}', String(minAdvanceDays));

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
    if (range.to) setDateDialogOpen(false);
  }

  function handleStartDateChange(date: Date | undefined) {
    if (!date) {
      setBooking({ startDate: undefined, endDate: undefined, days: undefined });
      return;
    }

    const nextDays = Number(booking.dayOption);
    const endDate = addCalendarDays(date, nextDays);
    if (rangeContainsUnavailable(date, endDate, unavailableDates)) return;

    setBooking({
      startDate: toDateKey(date),
      endDate: toDateKey(endDate),
      days: nextDays,
    });
    setDateDialogOpen(false);
  }

  function changeDayOption(dayOption: DayOption) {
    setBooking({
      dayOption,
      startDate: undefined,
      endDate: undefined,
      days: undefined,
      total: undefined,
    });
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
                loading="eager"
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
          <button
            type="button"
            onClick={() => router.push(`/for-rent/${id}`)}
            className="mb-5 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm font-semibold text-gf-brown-700 hover:text-gf-brown-900"
          >
            <ArrowLeft size={17} />
            {t.back}
          </button>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gf-brown-800 text-sm font-bold text-white">1</span>
            <div>
              <div className="text-[19px] font-bold text-gf-brown-900">{t.duration}</div>
              <p className="mb-0 mt-0.5 text-[12.5px] text-gf-muted">{t.selectDurationHint}</p>
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

          <section className="mt-7 rounded-[16px] border border-gf-line bg-gf-pink-100/50 p-3.5 sm:p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gf-pink-500 text-sm font-bold text-gf-brown-900">2</span>
              <div>
                <h2 className="m-0 text-[17px] font-bold text-gf-brown-900">{t.chooseDate}</h2>
                <p className="mb-0 mt-0.5 text-[12.5px] text-gf-muted">{t.selectDateRange}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDateDialogOpen(true)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-[12px] border border-gf-line bg-white px-3.5 py-3.5 text-left transition-colors hover:border-gf-pink-400"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gf-pink-100 text-gf-brown-800">
                <CalendarIcon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-gf-muted">{t.chooseDate}</span>
                <span className="mt-0.5 block truncate text-sm font-bold text-gf-brown-900">
                  {selectedRange?.from
                    ? selectedRange.to
                      ? `${dateFormatter.format(selectedRange.from)} - ${dateFormatter.format(selectedRange.to)}`
                      : dateFormatter.format(selectedRange.from)
                    : t.notSelected}
                </span>
              </span>
              {days > 0 && (
                <span className="shrink-0 rounded-full bg-gf-pink-100 px-2.5 py-1 text-xs font-bold text-gf-brown-800">
                  {days} {t.days}
                </span>
              )}
            </button>
          </section>

          <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
            <DialogContent className="max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-none overflow-y-auto p-0 sm:max-w-[500px]">
              <DialogHeader className="border-b border-gf-line px-5 py-5 pr-14">
                <DialogTitle className="flex items-center gap-2 text-lg text-gf-brown-900">
                  <CalendarIcon size={20} />
                  {t.chooseDate}
                </DialogTitle>
                <p className="mb-0 text-[12.5px] leading-relaxed text-gf-muted">{t.selectDateRange}</p>
              </DialogHeader>
              <div className="p-3 sm:p-5">
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <DateSummary
                    label={t.startDate}
                    value={selectedRange?.from ? dateFormatter.format(selectedRange.from) : t.notSelected}
                    active={Boolean(selectedRange?.from)}
                  />
                  <DateSummary
                    label={t.endDate}
                    value={selectedRange?.to ? dateFormatter.format(selectedRange.to) : t.notSelected}
                    active={Boolean(selectedRange?.to)}
                  />
                </div>
                <div className="rounded-[12px] border border-gf-line bg-white p-1.5 sm:p-3">
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
                      className="mx-auto w-full [--cell-size:clamp(30px,10vw,42px)] [&_.rdp-month]:w-full [&_.rdp-months]:w-full"
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
                          addCalendarDays(date, Number(booking.dayOption)),
                          unavailableDates,
                        )
                      )}
                      locale={locale === 'th' ? th : enUS}
                      className="mx-auto w-full [--cell-size:clamp(30px,10vw,42px)] [&_.rdp-month]:w-full [&_.rdp-months]:w-full"
                    />
                  )}
                </div>
                <p className="mb-0 mt-3 text-[12px] leading-relaxed text-gf-muted">{dateRule}</p>
              </div>
            </DialogContent>
          </Dialog>

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

          <div className="mt-6 border-t border-gf-line pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-[17px] font-bold text-gf-brown-900">
                <MapPin size={18} />
                {t.deliveryAddressTitle}
              </div>
              <button
                type="button"
                onClick={() => router.push('/account/address')}
                className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-gf-brown-800 underline"
              >
                <Plus size={15} />
                {addresses.length === 0 ? t.addDeliveryAddress : t.manageAddresses}
              </button>
            </div>
            <p className="mb-3 mt-1.5 text-[12.5px] leading-relaxed text-gf-muted">
              {t.deliveryAddressHint}
            </p>

            {addressesLoading ? (
              <div className="rounded-[14px] border border-gf-line px-4 py-4 text-[13px] text-gf-muted">
                {t.loadingAddresses}
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-[14px] border border-gf-pink-300 bg-gf-pink-100 px-4 py-4 text-[13px] leading-relaxed text-gf-brown-800">
                {t.deliveryAddressRequired}
              </div>
            ) : (
              <div className="space-y-2.5">
                {addresses.map((address) => {
                  const selected = address.id === selectedDeliveryAddress?.id;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setBooking({ deliveryAddressId: address.id })}
                      className={cn(
                        'flex w-full cursor-pointer items-start gap-3 rounded-[14px] border-[1.5px] px-4 py-3.5 text-left transition-colors',
                        selected
                          ? 'border-gf-brown-800 bg-gf-pink-100'
                          : 'border-gf-line bg-white hover:border-gf-pink-300',
                      )}
                    >
                      <span className={cn(
                        'mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2',
                        selected ? 'border-gf-brown-800' : 'border-gf-brown-300',
                      )}>
                        {selected && <span className="size-2 rounded-full bg-gf-brown-800" />}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 font-bold text-gf-brown-900">
                          {address.label}
                          {address.isDefault && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gf-brown-700">
                              {t.defaultAddress}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-[13px] font-medium text-gf-brown-800">
                          {address.recipientName} · {address.recipientPhone}
                        </span>
                        <span className="mt-1 block text-[12.5px] leading-relaxed text-gf-muted">
                          {formatDeliveryAddress(address)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3.5 rounded-[14px] bg-gf-pink-100 p-3.5 text-[13px] leading-relaxed text-gf-brown-700">
            {bookingRule}
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

function DateSummary({
  label,
  value,
  active,
}: {
  label: string
  value: string
  active: boolean
}) {
  return (
    <div className={cn(
      'rounded-[10px] border px-3.5 py-3',
      active ? 'border-gf-pink-400 bg-gf-pink-100' : 'border-gf-line bg-white/75',
    )}>
      <div className="text-[11px] font-semibold text-gf-muted">{label}</div>
      <div className={cn(
        'mt-1 text-sm font-bold',
        active ? 'text-gf-brown-900' : 'text-gf-brown-400',
      )}>
        {value}
      </div>
    </div>
  )
}

function formatDeliveryAddress(address: Address) {
  return [
    address.addressLine,
    address.subdistrict,
    address.district,
    address.province,
    address.postalCode,
    address.landmark,
  ].filter(Boolean).join(' ');
}
