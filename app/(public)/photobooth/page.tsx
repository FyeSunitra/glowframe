'use client'

import { ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { photoboothService } from '@/services/photobooth'
import { useAppStore } from '@/store/appStore'
import type { PhotoboothFrame } from '@/types/photobooth'

export default function PhotoboothPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'photobooth')
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
}: {
  frame: PhotoboothFrame
  locale: 'th' | 'en'
  actionLabel: string
}) {
  const name = locale === 'th' ? frame.nameTh : frame.nameEn
  const landscape = frame.canvasWidth >= frame.canvasHeight
  const hoverLabel = frame.price && frame.price > 0
    ? formatFramePrice(frame.price, locale)
    : undefined
  return (
    <Link
      href={`/photobooth/studio?frameId=${frame.id}`}
      aria-label={name}
      className="group flex h-[420px] w-[min(76vw,340px)] shrink-0 snap-center items-center justify-center p-2 outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-gf-pink-400 sm:w-[340px] lg:w-[360px]"
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
    </Link>
  )
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
