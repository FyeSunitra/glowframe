'use client';

import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open, onOpenChange, title, description, onConfirm, destructive,
}: ConfirmDialogProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{translateText(locale, title)}</AlertDialogTitle>
          <AlertDialogDescription>{translateText(locale, description)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full">
            {translateText(locale, 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              'rounded-full',
              destructive ? 'bg-gf-red text-white' : 'bg-gf-pink-500 text-gf-brown-900',
            )}
          >
            {translateText(locale, 'Confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
