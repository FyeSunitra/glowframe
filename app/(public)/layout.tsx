'use client';

import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';

/* App shell layout — wraps all authenticated pages */
export default function AppLayout({ children }: { children: React.ReactNode }) {
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
