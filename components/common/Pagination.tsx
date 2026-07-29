'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPageText } from '@/lib/menuI18n'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

interface PaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  className?: string
}

const LIMIT_OPTIONS = [10, 20, 50]

function getVisiblePages(page: number, totalPages: number) {
  const count = Math.min(5, totalPages)
  const start = Math.min(
    Math.max(1, page - Math.floor(count / 2)),
    Math.max(1, totalPages - count + 1),
  )

  return Array.from({ length: count }, (_, index) => start + index)
}

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  className,
}: PaginationProps) {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminMasterData').pagination
  const safeTotalPages = Math.max(1, totalPages)
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1
  const lastItem = Math.min(page * limit, total)

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-3 border-t border-gf-line pt-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-gf-muted">
        {t.showing} {firstItem}-{lastItem} {t.of} {total} {t.items}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-gf-muted">{t.perPage}</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => onLimitChange(Number(value ?? limit))}
          >
            <SelectTrigger className="h-9 w-[76px] rounded-[8px] px-2.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex items-center gap-1" aria-label={t.label}>
          <button
            type="button"
            title={t.previous}
            aria-label={t.previous}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-gf-line bg-white text-gf-brown-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>

          {getVisiblePages(page, safeTotalPages).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              aria-label={`${t.page} ${pageNumber}`}
              aria-current={pageNumber === page ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
              className={cn(
                'h-9 min-w-9 cursor-pointer rounded-[8px] border px-2 text-sm font-semibold',
                pageNumber === page
                  ? 'border-gf-brown-800 bg-gf-brown-800 text-white'
                  : 'border-gf-line bg-white text-gf-brown-800',
              )}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            title={t.next}
            aria-label={t.next}
            disabled={page >= safeTotalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-gf-line bg-white text-gf-brown-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    </div>
  )
}
