'use client';

import type { ReactNode } from 'react';
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from '@/components/ui/table';
import { LoadingSkeleton } from './LoadingSkeleton';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface Column<T extends object> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  loading,
  empty,
  onRowClick,
}: DataTableProps<T>) {
  const locale = useAppStore((s) => s.locale);

  if (loading) {
    return <LoadingSkeleton rows={8} cols={columns.length} />;
  }

  return (
    <div className="w-full overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className="[padding:12px_16px] text-[12px] font-semibold text-gf-muted bg-gf-pink-100 [border-bottom:1px_solid_var(--gf-line)]"
            >
              {translateText(locale, col.header)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="[padding:0]">
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, i) => (
            <HoverRow
              key={String('id' in row ? row.id : i)}
              columns={columns}
              row={row}
              onClick={onRowClick}
            />
          ))
        )}
      </TableBody>
    </Table>
    </div>
  );
}

function HoverRow<T extends object>({
  columns,
  row,
  onClick,
}: {
  columns: Column<T>[]
  row: T
  onClick?: (row: T) => void
}) {
  return (
    <TableRow
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        '[transition:background_.12s]',
        onClick && 'cursor-pointer focus-visible:bg-gf-pink-100 focus-visible:outline-none',
      )}
      onClick={() => onClick?.(row)}
      onKeyDown={(event) => {
        if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return
        event.preventDefault()
        onClick(row)
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gf-pink-100)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {columns.map((col) => (
        <TableCell
          key={col.key}
          className="[padding:14px_16px] text-[14px] text-gf-brown-800 [border-bottom:1px_solid_var(--gf-line)]"
        >
          {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
        </TableCell>
      ))}
    </TableRow>
  );
}
