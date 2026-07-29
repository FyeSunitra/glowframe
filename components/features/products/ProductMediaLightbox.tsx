'use client'

import Image from 'next/image'
import { useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { translateText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

interface ProductMediaItem {
  id: number | string
  mediaType: 'image' | 'video'
  url: string
}

interface ProductMediaLightboxProps {
  media: ProductMediaItem[]
  productName: string
  initialIndex: number | null
  onIndexChange: (index: number | null) => void
  onOpenChange: (open: boolean) => void
}

export function ProductMediaLightbox({
  media,
  productName,
  initialIndex,
  onIndexChange,
  onOpenChange,
}: ProductMediaLightboxProps) {
  const locale = useAppStore((state) => state.locale)
  const open = initialIndex !== null && media.length > 0
  const index = Math.min(
    Math.max(initialIndex ?? 0, 0),
    Math.max(media.length - 1, 0),
  )

  const current = media[index]
  const labels = useMemo(
    () => ({
      previous: translateText(locale, 'Previous'),
      next: translateText(locale, 'Next'),
      media: translateText(locale, 'Product media'),
    }),
    [locale],
  )

  useEffect(() => {
    if (!open || media.length < 2) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        onIndexChange((index - 1 + media.length) % media.length)
      }
      if (event.key === 'ArrowRight') {
        onIndexChange((index + 1) % media.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [index, media.length, onIndexChange, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[calc(90dvh-1rem)] w-[calc(100vw-1rem)] max-w-none overflow-hidden rounded-[8px] border-0 bg-[#171717] p-0 text-white sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] xl:max-w-[1600px]">
        <DialogTitle className="sr-only">
          {productName} {labels.media}
        </DialogTitle>

        {current && (
          <div className="relative flex h-full min-h-0 items-center justify-center p-3 sm:p-8">
            {current.mediaType === 'image' ? (
              <div className="relative h-full w-full">
                <Image
                  src={current.url}
                  alt={`${productName} ${index + 1}`}
                  fill
                  priority
                  sizes="96vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <video
                key={current.url}
                src={current.url}
                controls
                autoPlay
                className="max-h-full max-w-full object-contain"
              />
            )}

            {media.length > 1 && (
              <>
                <button
                  type="button"
                  title={labels.previous}
                  aria-label={labels.previous}
                  onClick={() =>
                    onIndexChange((index - 1 + media.length) % media.length)
                  }
                  className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/60 text-white sm:left-5"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  title={labels.next}
                  aria-label={labels.next}
                  onClick={() => onIndexChange((index + 1) % media.length)}
                  className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/60 text-white sm:right-5"
                >
                  <ChevronRight size={24} />
                </button>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                  {index + 1} / {media.length}
                </span>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
