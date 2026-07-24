import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  rows?: number;
  cols?: number;
}

export function LoadingSkeleton({ rows = 8, cols = 6 }: LoadingSkeletonProps) {
  return (
    <Table>
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
  );
}
