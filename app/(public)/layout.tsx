'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store/appStore';

/* App shell layout — wraps all authenticated pages */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const router = useRouter();

  // Redirect to login if not authenticated
  // (future: Supabase session check goes here)
  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gf-cream">
      <Topbar />
      <div className="mx-auto flex max-w-[1440px] max-[900px]:flex-col">
        <Sidebar />
        <main className="min-w-0 flex-1 px-[30px] pb-20 pt-[26px] max-[900px]:px-4 max-[900px]:pb-[60px] max-[900px]:pt-5">
          {children}
        </main>
      </div>
    </div>
  );
}
