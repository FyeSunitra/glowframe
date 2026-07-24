'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Calendar, Truck, MailCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CameraGlyph } from '@/components/common/CameraGlyph';
import { useAppStore } from '@/store/appStore';
import { cn, money } from '@/lib/utils';
import type { Product, DayOption, DeliveryOption } from '@/types';

const MONTH_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const MIN_LEAD_DAYS = 5;

function dateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function addDays(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isBeforeLeadTime(key: string): boolean {
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  min.setDate(min.getDate() + MIN_LEAD_DAYS);
  return new Date(`${key}T00:00:00`) < min;
}

function rangeDates(startKey: string, dayCount: number): string[] {
  return Array.from({ length: dayCount }, (_, i) => addDays(startKey, i));
}

function CalendarPicker({ month, year, dayCount, selected, unavailableDates, onPick, onShift }: {
  month: number; year: number; dayCount: number; unavailableDates: string[];
  selected: number | null; onPick: (d: number) => void; onShift: (dir: -1 | 1) => void;
}) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div className="bg-white [border:1px_solid_var(--gf-line)] rounded-[16px] [padding:16px] w-[290px] [box-shadow:var(--gf-shadow)]">
      <div className="flex justify-between items-center [margin-bottom:10px] font-bold text-[14px]">
        <span>{MONTH_TH[month]} {year + 543}</span>
        <div className="flex gap-[6px]">
          {([-1, 1] as const).map((dir) => (
            <button key={dir} onClick={() => onShift(dir)} className="w-[26px] h-[26px] rounded-full [border:1px_solid_var(--gf-line)] bg-white cursor-pointer flex items-center justify-center">
              {dir === -1 ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
            </button>
          ))}
        </div>
      </div>
      <div className="grid [grid-template-columns:repeat(7,1fr)] gap-[4px] text-[12px] text-center">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-gf-muted font-semibold [padding:4px_0]">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="[visibility:hidden]">.</div>;
          const key = dateKey(year, month, d);
          const overlaps = rangeDates(key, dayCount).some((rangeKey) => unavailableDates.includes(rangeKey));
          const disabled = isBeforeLeadTime(key) || overlaps;
          const inRange = selected !== null && d >= selected && d < selected + dayCount;
          return (
            <div
              key={d}
              onClick={() => { if (!disabled) onPick(d); }}
              title={disabled ? 'Unavailable or less than 5 days ahead' : undefined}
              className={cn(
                'rounded-lg py-[7px]',
                disabled && 'cursor-not-allowed bg-gf-pink-100 font-normal text-gf-muted opacity-45',
                inRange && !disabled && 'cursor-pointer bg-gf-brown-300 font-bold text-gf-brown-900 opacity-100',
                !disabled && !inRange && 'cursor-pointer bg-transparent font-normal text-gf-ink opacity-100',
              )}
            >{d}</div>
          );
        })}
      </div>
      <div className="[margin-top:10px] text-[11.5px] text-gf-muted [line-height:1.5]">
        Dates less than 5 days ahead or already booked are disabled.
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { booking, setBooking, resetTxnPay, user } = useAppStore((s) => ({
    booking: s.booking,
    setBooking: s.setBooking,
    resetTxnPay: s.resetTxnPay,
    user: s.user,
  }));
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const { data: product } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => (await axios.get(`/api/products/${id}`)).data.data,
    enabled: !!id,
  });

  useEffect(() => {
    if (id) setBooking({ productId: Number(id) });
  }, [id, setBooking]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!product) return <div className="[padding:60px] text-gf-muted">Loading...</div>;

  const dayOptions: { key: DayOption; label: string; price: number | null }[] = [
    { key: '1', label: '1 Day', price: product.price },
    { key: '3', label: '3 Days', price: Math.round(product.price * 2.8) },
    { key: '5', label: '5 Days', price: Math.round(product.price * 4.6) },
    { key: 'custom', label: 'Custom days (prototype: 1 day)', price: null },
  ];
  const deliveryOptions: { key: DeliveryOption; label: string }[] = [
    { key: 'pickup', label: 'Pickup by renter' },
    { key: 'grab', label: 'Messenger / Grab, paid by renter' },
    { key: 'post', label: 'Post / shipping, fee included in checkout' },
  ];
  const rangeLen = booking.dayOption === 'custom' ? 1 : Number(booking.dayOption);
  const selectedStart = booking.selectedDate ? dateKey(booking.calYear, booking.calMonth, booking.selectedDate) : '';
  const selectedRange = selectedStart ? rangeDates(selectedStart, rangeLen) : [];
  const hasOverlap = selectedRange.some((key) => product.unavailableDates?.includes(key));
  const verificationBlocked = !user.emailVerified || user.suspended;

  function goTransaction() {
    if (verificationBlocked) {
      router.push('/account/security');
      return;
    }
    if (!selectedStart) return;
    if (isBeforeLeadTime(selectedStart) || hasOverlap) return;
    resetTxnPay();
    setBooking({
      startDate: selectedStart,
      endDate: addDays(selectedStart, rangeLen - 1),
      paymentStatus: 'not_started',
      paymentProofName: undefined,
    });
    router.push('/transaction');
  }

  const canContinue = !!selectedStart && !hasOverlap && !isBeforeLeadTime(selectedStart) && !verificationBlocked;

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['For Rent', product.name]} />

      {verificationBlocked && (
        <div className="bg-gf-pink-100 rounded-[22px] [box-shadow:var(--gf-shadow-sm)] [padding:18px] [margin-bottom:20px] flex items-center gap-[12px]">
          <MailCheck size={22} className="text-gf-brown-700 shrink-0" />
          <div className="flex-1 text-[13.5px] text-gf-brown-700 [line-height:1.6]">
            Email verification is required before creating a rental request.
          </div>
          <button onClick={() => router.push('/account/security')} className="cursor-pointer rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-4 py-[9px] text-[13px] font-semibold text-gf-brown-800">Review account</button>
        </div>
      )}

      <div className="grid grid-cols-[300px_1fr] items-start gap-[26px] max-[900px]:grid-cols-1">
        <div className="bg-gf-pink-100 rounded-[22px] [padding:26px] text-center">
          <div className="bg-white rounded-[14px] [padding:12px] font-bold text-[13.5px] [margin-bottom:16px] [box-shadow:var(--gf-shadow-sm)]">{product.name}</div>
          <CameraGlyph color={product.color} size={130} />
          <button onClick={goTransaction} className={cn(
            'mt-4 w-full rounded-full border-0 bg-gf-pink-500 px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-900',
            canContinue ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-45',
          )}>
            Submit rental request
          </button>
        </div>

        <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
          <div className="flex justify-between items-center gap-[12px] flex-wrap">
            <div className="text-[19px] font-bold text-gf-brown-900">Rental duration</div>
            <div ref={calRef} className="relative">
              <span onClick={() => setCalOpen((o) => !o)} className="flex items-center gap-[6px] cursor-pointer text-[12px] text-gf-brown-700 underline font-semibold">
                {selectedStart || 'Choose rental date'} <Calendar size={15} />
              </span>
              {calOpen && (
                <div className="absolute right-[0] top-[calc(100%_+_8px)] z-[30]">
                  <CalendarPicker
                    month={booking.calMonth} year={booking.calYear}
                    dayCount={rangeLen} selected={booking.selectedDate}
                    unavailableDates={product.unavailableDates ?? []}
                    onPick={(d) => setBooking({ selectedDate: d })}
                    onShift={(dir) => {
                      let m = booking.calMonth + dir, y = booking.calYear;
                      if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
                      setBooking({ calMonth: m, calYear: y, selectedDate: null });
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="[margin-top:16px]">
            {dayOptions.map((o) => (
              <div key={o.key} onClick={() => setBooking({ dayOption: o.key, selectedDate: null })} className={cn(
                'mb-2.5 flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-[13px] text-sm',
                booking.dayOption === o.key ? 'border-gf-brown-800 bg-gf-pink-100' : 'border-gf-line bg-transparent',
              )}>
                <div className={cn(
                  'relative size-[18px] shrink-0 rounded-full border-2',
                  booking.dayOption === o.key ? 'border-gf-brown-800' : 'border-gf-brown-300',
                )}>
                  {booking.dayOption === o.key && <div className="absolute [inset:3px] rounded-full bg-gf-brown-800" />}
                </div>
                <div>
                  {o.price !== null ? (
                    <><span className="font-bold text-gf-brown-900">{money(o.price)} THB</span> <span className="text-gf-muted">/ {o.label}</span></>
                  ) : o.label}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[19px] font-bold text-gf-brown-900 [margin-top:26px] flex items-center gap-[10px]">
            Delivery option <Truck size={18} />
          </div>
          <div className="[margin-top:12px]">
            {deliveryOptions.map((o) => (
              <div key={o.key} onClick={() => setBooking({ delivery: o.key })} className={cn(
                'mb-2.5 flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-[13px] text-sm',
                booking.delivery === o.key ? 'border-gf-brown-800 bg-gf-pink-100' : 'border-gf-line bg-transparent',
              )}>
                <div className={cn(
                  'relative size-[18px] shrink-0 rounded-full border-2',
                  booking.delivery === o.key ? 'border-gf-brown-800' : 'border-gf-brown-300',
                )}>
                  {booking.delivery === o.key && <div className="absolute [inset:3px] rounded-full bg-gf-brown-800" />}
                </div>
                {o.label}
              </div>
            ))}
          </div>

          <div className="bg-gf-pink-100 rounded-[14px] [padding:14px] [margin-top:14px] text-[13px] text-gf-brown-700 [line-height:1.6]">
            Bookings must start at least {MIN_LEAD_DAYS} days from today. Already reserved dates are unavailable for this camera.
          </div>

          <button onClick={goTransaction} className={cn(
            'mt-3.5 w-full rounded-full border-0 bg-gf-brown-800 px-[26px] py-[13px] text-[15px] font-semibold text-gf-pink-100',
            canContinue ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-45',
          )}>
            Continue to payment proof
          </button>
        </div>
      </div>
    </div>
  );
}
