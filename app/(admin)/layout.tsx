'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminTopbar } from '@/components/admin/layout/AdminTopbar'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { useAppStore } from '@/store/appStore'
import { authService } from '@/services/auth'
import { getPageText } from '@/lib/menuI18n'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const login = useAppStore((state) => state.login)
  const logout = useAppStore((state) => state.logout)
  const locale = useAppStore((state) => state.locale)
  const router = useRouter()
  const loadingText = getPageText(locale, 'catalog').loading

  useEffect(() => {
    let active = true

    async function hydrateSession() {
      const result = await authService.session()
      if (!active) return

      if (!result.success) {
        logout()
        router.replace('/login')
      } else if (result.data.user.role !== 'admin') {
        login(result.data.user)
        router.replace('/home')
      } else {
        login(result.data.user)
      }
      setIsCheckingSession(false)
    }

    void hydrateSession()
    return () => {
      active = false
    }
  }, [login, logout, router])

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gf-cream text-sm text-gf-muted">
        {loadingText}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gf-cream">
      <AdminTopbar />
      <div className="mx-auto flex max-w-[1440px] max-[900px]:flex-col">
        <AdminSidebar />
        <main className="min-w-0 flex-1 px-[30px] pb-20 pt-[26px] max-[900px]:px-4 max-[900px]:pb-[60px] max-[900px]:pt-5">
          {children}
        </main>
      </div>
    </div>
  )
}
