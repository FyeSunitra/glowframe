import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/common/LoadingState';

interface LoadingSkeletonProps {
  rows?: number;
  cols?: number;
}

export function LoadingSkeleton({ rows = 8, cols = 6 }: LoadingSkeletonProps) {
  return (
    <div className="relative" role="status" aria-label="Loading table data">
      <div className="absolute inset-x-0 top-3 z-10 flex justify-center text-gf-pink-600">
        <LoadingSpinner size="sm" />
      </div>
      <Table aria-hidden="true">
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
