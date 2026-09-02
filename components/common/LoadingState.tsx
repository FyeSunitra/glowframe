import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

type LoadingSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<LoadingSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-7',
}

interface LoadingSpinnerProps {
  size?: LoadingSize
  className?: string
  label?: string
}

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading',
}: LoadingSpinnerProps) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)} role="status">
      <LoaderCircle className={cn('animate-spin', sizeClasses[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

interface LoadingStateProps {
  label: string
  className?: string
  compact?: boolean
}

export function LoadingState({ label, className, compact = false }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center text-sm text-gf-muted',
        compact ? 'py-8' : 'py-16',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" label={label} className="text-gf-pink-600" />
      <span>{label}</span>
    </div>
  )
}
