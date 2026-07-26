'use client'

import { SwaggerDocs } from './SwaggerDocs'
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

export default function ApiDocsPage() {
  const t = getPageText(useAppStore((state) => state.locale), 'apiDocs')
  return (
    <main className="min-h-screen bg-[#f8f2ec]">
      <div className="[padding:28px_32px_18px] [border-bottom:1px_solid_rgba(82,_54,_38,_0.12)] bg-white">
        <p className="[margin:0_0_6px] text-gf-muted text-[13px] font-bold uppercase">
          GlowFrame
        </p>
        <h1 className="[margin:0] text-gf-brown-900 font-[var(--font-poppins)] text-[28px] font-extrabold">
          {t.title}
        </h1>
      </div>
      <SwaggerDocs />
    </main>
  )
}
