'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminTopbar } from '@/components/admin/layout/AdminTopbar'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { useAppStore } from '@/store/appStore'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAppStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    user: s.user,
  }))
  const router = useRouter()
  const canAccessAdmin = isAuthenticated && user.role === 'admin'

  // useEffect(() => {
  //   if (!canAccessAdmin) router.replace('/login')
  // }, [canAccessAdmin, router])

  // if (!canAccessAdmin) return null

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
