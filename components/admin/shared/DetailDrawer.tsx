'use client';

import type { ReactNode } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { translateText, translateStatus } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function DetailDrawer({
  open, onOpenChange, title, subtitle, children, footer,
}: DetailDrawerProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] flex flex-col [padding:0]">
        <SheetHeader className="[padding:24px_24px_0]">
          <SheetTitle className="text-[18px] font-bold text-gf-brown-900">
            {translateText(locale, title)}
          </SheetTitle>
          {subtitle && (
            <SheetDescription className="text-[13px] text-gf-muted">
              {translateStatus(locale, subtitle)}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="overflow-y-auto flex-1 [padding:20px_24px]">
          {children}
        </div>
        {footer && (
          <div className="[border-top:1px_solid_var(--gf-line)] [padding:16px_24px]">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
