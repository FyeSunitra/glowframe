'use client'

import { translateText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

export function useMenuI18n() {
  const locale = useAppStore((state) => state.locale)

  return {
    locale,
    tr: (value: string) => translateText(locale, value),
  }
}
