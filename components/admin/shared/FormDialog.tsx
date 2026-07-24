'use client';

import type { ReactNode } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
}

export function FormDialog({
  open, onOpenChange, title, children, onSubmit, submitLabel = 'Save',
}: FormDialogProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold text-gf-brown-900">
            {translateText(locale, title)}
          </DialogTitle>
        </DialogHeader>
        <div>{children}</div>
        <DialogFooter className="gap-[10px]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_18px] font-semibold text-[14px] cursor-pointer"
          >
            {translateText(locale, 'Cancel')}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:9px_18px] font-semibold text-[14px] cursor-pointer"
          >
            {translateText(locale, submitLabel)}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
