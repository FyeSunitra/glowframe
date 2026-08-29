'use client'

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogIconTitle,
} from '@/components/ui/dialog'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { photoboothService } from '@/services/photobooth'
import { useAppStore } from '@/store/appStore'
import type { PhotoboothFrame } from '@/types/photobooth'
import type { PhotoboothQrPayment } from '@/types/photoboothPayment'

export default function PhotoboothPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'photobooth')
  const router = useRouter()
  const [selectedFrame, setSelectedFrame] = useState<PhotoboothFrame | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const { data: frames = [], isLoading } = useQuery({
    queryKey: ['photobooth-frames', 'public'],
    queryFn: async () => unwrapApiResponse(await photoboothService.list()),
  })
  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.breadcrumb]} />

      <header className="mb-7 max-w-2xl">
        <h1 className="m-0 text-2xl font-bold text-gf-brown-900 sm:text-[30px]">
          {t.title}
        </h1>
        <p className="mb-0 mt-2 text-sm leading-6 text-gf-muted">{t.subtitle}</p>
      </header>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-gf-muted">{t.loading}</div>
      ) : frames.length > 0 ? (
        <FrameCarousel
          label={t.title}
          previousLabel={t.previousFrame}
          nextLabel={t.nextFrame}
        >
          {frames.map((frame) => (
            <DatabaseFrameCard
              key={frame.id}
              frame={frame}
              locale={locale}
              actionLabel={t.chooseStyle}
              onSelect={() => {
                if (frame.price && frame.price > 0) {
                  setSelectedFrame(frame)
                  setPaymentOpen(true)
                } else {
                  router.push(`/photobooth/studio?frameId=${frame.id}`)
                }
              }}
            />
          ))}
        </FrameCarousel>
      ) : (
        <div className="rounded-[8px] border border-dashed border-gf-line bg-white py-16 text-center text-sm text-gf-muted">
          {t.noFrames}
        </div>
      )}

      <div className="mt-6 flex items-start gap-2.5 border-t border-gf-line pt-5 text-xs leading-5 text-gf-muted">
        <LockKeyhole className="mt-0.5 shrink-0 text-gf-brown-500" size={16} />
        <span>{t.privacyNote}</span>
      </div>

      {selectedFrame && (
        <PhotoboothPaymentDialog
          key={selectedFrame.id}
          open={paymentOpen}
          frame={selectedFrame}
          locale={locale}
          t={t}
          onOpenChange={setPaymentOpen}
          onPaid={(paymentId) => {
            setPaymentOpen(false)
            router.push(`/photobooth/studio?frameId=${selectedFrame.id}&paymentId=${paymentId}`)
          }}
        />
      )}
    </div>
  )
}

function FrameCarousel({
  children,
  label,
  previousLabel,
  nextLabel,
}: {
  children: ReactNode
  label: string
  previousLabel: string
  nextLabel: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateControls = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    setCanScrollLeft(scroller.scrollLeft > 4)
    setCanScrollRight(
      scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4,
    )
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    updateControls()
    const resizeObserver = new ResizeObserver(updateControls)
    resizeObserver.observe(scroller)
    return () => resizeObserver.disconnect()
  }, [updateControls])

  const scroll = (direction: 'left' | 'right') => {
    const scroller = scrollerRef.current
    if (!scroller) return

    scroller.scrollBy({
      left: direction === 'left' ? -scroller.clientWidth * 0.8 : scroller.clientWidth * 0.8,
      behavior: 'smooth',
    })
  }

  return (
    <section className="relative px-1 sm:px-14" aria-label={label}>
      <button
        type="button"
        title={previousLabel}
        aria-label={previousLabel}
        disabled={!canScrollLeft}
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-gf-line bg-white text-gf-brown-800 shadow-[var(--gf-shadow)] transition-[background-color,color,opacity,transform] hover:scale-105 hover:bg-gf-pink-100 disabled:pointer-events-none disabled:opacity-30 sm:size-12"
      >
        <ChevronLeft size={22} />
      </button>
      <div
        ref={scrollerRef}
        onScroll={updateControls}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-12 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-1"
      >
        {children}
      </div>
      <button
        type="button"
        title={nextLabel}
        aria-label={nextLabel}
        disabled={!canScrollRight}
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-gf-line bg-white text-gf-brown-800 shadow-[var(--gf-shadow)] transition-[background-color,color,opacity,transform] hover:scale-105 hover:bg-gf-pink-100 disabled:pointer-events-none disabled:opacity-30 sm:size-12"
      >
        <ChevronRight size={22} />
      </button>
    </section>
  )
}

function DatabaseFrameCard({
  frame,
  locale,
  actionLabel,
  onSelect,
}: {
  frame: PhotoboothFrame
  locale: 'th' | 'en'
  actionLabel: string
  onSelect: () => void
}) {
  const name = locale === 'th' ? frame.nameTh : frame.nameEn
  const landscape = frame.canvasWidth >= frame.canvasHeight
  const hoverLabel = frame.price && frame.price > 0
    ? formatFramePrice(frame.price, locale)
    : undefined
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={name}
      className="group flex h-[420px] w-[min(76vw,340px)] shrink-0 snap-center items-center justify-center border-0 bg-transparent p-2 outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-gf-pink-400 sm:w-[340px] lg:w-[360px]"
    >
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="relative max-h-full max-w-full overflow-hidden rounded-[8px]"
          style={{
            aspectRatio: `${frame.canvasWidth}/${frame.canvasHeight}`,
            width: landscape ? '100%' : undefined,
            height: landscape ? undefined : '100%',
          }}
        >
          <Image
            src={frame.overlayUrl}
            alt={name}
            fill
            unoptimized
            className="object-contain"
          />
          <FrameHoverOverlay price={hoverLabel} actionLabel={actionLabel} />
        </div>
      </div>
    </button>
  )
}

function PhotoboothPaymentDialog({
  open,
  frame,
  locale,
  t,
  onOpenChange,
  onPaid,
}: {
  open: boolean
  frame: PhotoboothFrame
  locale: 'th' | 'en'
  t: ReturnType<typeof getPageText<'photobooth'>>
  onOpenChange: (open: boolean) => void
  onPaid: (paymentId: number) => void
}) {
  const [payment, setPayment] = useState<PhotoboothQrPayment | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const startedRef = useRef(false)
  const activePaymentId = payment?.id
  const activePaymentStatus = payment?.status

  const createPayment = useCallback(async () => {
    setIsCreating(true)
    setError(null)
    setPayment(null)
    const result = await photoboothService.createPayment(frame.id)
    if (result.success) setPayment(result.data)
    else setError(t.paymentCreateFailed)
    setIsCreating(false)
  }, [frame.id, t.paymentCreateFailed])

  useEffect(() => {
    if (!open || startedRef.current) return
    startedRef.current = true
    void createPayment()
  }, [createPayment, open])

  useEffect(() => {
    if (!open || !activePaymentId || activePaymentStatus !== 'pending') return
    let active = true
    let timeoutId: number

    const poll = async () => {
      timeoutId = window.setTimeout(async () => {
        const result = await photoboothService.getPaymentStatus(activePaymentId)
        if (!active) return
        if (result.success) {
          setPayment((current) => current ? { ...current, ...result.data } : current)
        }
        if (active && (!result.success || result.data.status === 'pending')) void poll()
      }, 2500)
    }
    void poll()
    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [activePaymentId, activePaymentStatus, open])

  useEffect(() => {
    if (!payment?.expiresAt || payment.status !== 'pending') return
    const update = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((new Date(payment.expiresAt!).getTime() - Date.now()) / 1000)))
    }
    update()
    const intervalId = window.setInterval(update, 1000)
    return () => window.clearInterval(intervalId)
  }, [payment?.expiresAt, payment?.status])

  useEffect(() => {
    if (payment?.status !== 'succeeded') return
    const timeoutId = window.setTimeout(() => onPaid(payment.id), 900)
    return () => window.clearTimeout(timeoutId)
  }, [onPaid, payment?.id, payment?.status])

  const status = payment?.status
  const frameName = locale === 'th' ? frame.nameTh : frame.nameEn

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-none overflow-y-auto p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b border-gf-line px-5 py-5 pr-14 sm:px-7">
          <DialogIconTitle icon={<QrCode size={21} />} className="text-lg text-gf-brown-900">
            {t.paymentTitle}
          </DialogIconTitle>
          <DialogDescription className="pl-0 leading-6 sm:pl-[52px]">
            {t.paymentDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-6 sm:px-7">
          <div className="flex items-center justify-between gap-4 border-b border-gf-line py-4">
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold text-gf-brown-900">{frameName}</p>
              <p className="mb-0 mt-1 text-xs text-gf-muted">{t.paymentAmountLabel}</p>
            </div>
            <strong className="shrink-0 text-xl text-gf-brown-900">
              {formatFramePrice(frame.price ?? 0, locale)}
            </strong>
          </div>

          {isCreating && (
            <PaymentState icon={<LoaderCircle className="animate-spin" size={30} />} title={t.creatingPayment} />
          )}

          {!isCreating && error && (
            <PaymentState
              icon={<XCircle size={32} />}
              title={t.paymentCreateFailed}
              tone="error"
              action={<Button onClick={() => void createPayment()}><RefreshCcw />{t.retryPayment}</Button>}
            />
          )}

          {!isCreating && payment && status === 'pending' && (
            <div className="py-5 text-center">
              <div className="mx-auto w-full max-w-[290px] bg-white p-3">
                <Image
                  src={payment.qrImageBase64}
                  alt={t.paymentTitle}
                  width={560}
                  height={560}
                  unoptimized
                  className="h-auto w-full"
                />
              </div>
              <h3 className="mb-0 mt-3 text-base font-bold text-gf-brown-900">{t.waitingPayment}</h3>
              <p className="mx-auto mb-0 mt-1 max-w-sm text-xs leading-5 text-gf-muted">{t.waitingPaymentHint}</p>
              <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gf-brown-700">
                <Clock3 size={16} />
                {formatCountdown(remainingSeconds)}
              </div>
            </div>
          )}

          {!isCreating && status === 'succeeded' && (
            <PaymentState
              icon={<CheckCircle2 size={36} />}
              title={t.paymentSuccess}
              description={t.paymentSuccessHint}
              tone="success"
            />
          )}

          {!isCreating && (status === 'failed' || status === 'expired' || status === 'cancelled') && (
            <PaymentState
              icon={<XCircle size={34} />}
              title={status === 'expired' ? t.paymentExpired : t.paymentFailed}
              tone="error"
              action={<Button onClick={() => void createPayment()}><RefreshCcw />{t.retryPayment}</Button>}
            />
          )}

          <p className="mb-0 flex items-center justify-center gap-2 border-t border-gf-line pt-4 text-center text-xs text-gf-muted">
            <ShieldCheck size={15} />
            {t.securePayment}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PaymentState({
  icon,
  title,
  description,
  tone = 'default',
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  tone?: 'default' | 'success' | 'error'
  action?: ReactNode
}) {
  const color = tone === 'success' ? 'text-emerald-600' : tone === 'error' ? 'text-red-600' : 'text-gf-pink-600'
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center">
      <span className={color}>{icon}</span>
      <h3 className="mb-0 mt-4 text-base font-bold text-gf-brown-900">{title}</h3>
      {description && <p className="mb-0 mt-2 text-sm text-gf-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function FrameHoverOverlay({
  price,
  actionLabel,
}: {
  price?: string
  actionLabel: string
}) {
  return (
    <span className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gf-brown-900/55 px-4 text-center text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
      {price && <strong className="text-xl font-bold">{price}</strong>}
      <span className="text-sm font-semibold">{actionLabel}</span>
    </span>
  )
}

function formatFramePrice(price: number, locale: 'th' | 'en') {
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(price)
}
