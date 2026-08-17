import { Camera } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { PhotoboothFrameStyle } from '@/types/photobooth'

interface FramePreviewProps {
  style: PhotoboothFrameStyle
  color: string
  count?: number
  compact?: boolean
  className?: string
}

export function FramePreview({
  style,
  color,
  count = 3,
  compact = false,
  className,
}: FramePreviewProps) {
  return (
    <div
      className={cn(
        'relative mx-auto flex w-full max-w-[210px] flex-col overflow-hidden shadow-[0_14px_34px_rgba(76,54,48,0.16)]',
        style === 'minimal' ? 'gap-1.5 p-2.5 pb-8' : 'gap-2 p-3 pb-10',
        style === 'film' && 'px-6',
        compact ? 'max-w-[150px]' : 'aspect-[3/5]',
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {style === 'film' && (
        <>
          <FilmRail className="left-1.5" />
          <FilmRail className="right-1.5" />
        </>
      )}

      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white/85',
            style === 'classic' && 'rounded-[3px]',
            style === 'minimal' && 'border border-black/10',
          )}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(238,205,213,0.64))]" />
          <Camera className="relative text-gf-brown-500/55" size={compact ? 18 : 25} />
        </div>
      ))}

      <div
        className={cn(
          'absolute inset-x-0 bottom-2.5 text-center font-[var(--font-poppins)] text-[9px] font-semibold',
          isDark(color) ? 'text-white/85' : 'text-gf-brown-800/75',
        )}
      >
        GlowFrame
      </div>
    </div>
  )
}

function FilmRail({ className }: { className: string }) {
  return (
    <div className={cn('absolute bottom-3 top-3 flex w-2 flex-col justify-around', className)}>
      {Array.from({ length: 8 }, (_, index) => (
        <span key={index} className="h-2 rounded-[1px] bg-white/75" />
      ))}
    </div>
  )
}

function isDark(color: string) {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return false
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 < 150
}
