'use client';

import { useCallback, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

// Simple toast via a global DOM element — matches the original HTML behavior
export function useToast() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    const el = document.getElementById('gf-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('gf-toast--show');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => el.classList.remove('gf-toast--show'), 2400);
  }, []);

  return { showToast };
}

export { useAppStore };
