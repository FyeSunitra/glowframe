'use client'

import { ArrowRight, LockKeyhole } from 'lucide-react'
import Link from 'next/link'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { FramePreview } from '@/components/features/photobooth/FramePreview'
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'
import type { PhotoboothFrameStyle } from '@/types/photobooth'

const FRAME_STYLES: Array<{
  id: PhotoboothFrameStyle
  color: string
}> = [
  { id: 'classic', color: '#f4ccd5' },
  { id: 'film', color: '#4c3630' },
  { id: 'minimal', color: '#fffdf8' },
]

export default function PhotoboothPage() {
  const t = getPageText(useAppStore((state) => state.locale), 'photobooth')

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.breadcrumb]} />

      <header className="mb-7 max-w-2xl">
        <h1 className="m-0 text-2xl font-bold text-gf-brown-900 sm:text-[30px]">
          {t.title}
        </h1>
        <p className="mb-0 mt-2 text-sm leading-6 text-gf-muted">{t.subtitle}</p>
      </header>

      <section className="grid gap-5 md:grid-cols-3" aria-label={t.title}>
        {FRAME_STYLES.map((frame) => (
          <article
            key={frame.id}
            className="group grid min-h-[430px] grid-rows-[1fr_auto] overflow-hidden rounded-[8px] bg-white shadow-[var(--gf-shadow-sm)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[var(--gf-shadow)]"
          >
            <div className="flex items-center justify-center bg-gf-pink-100/55 px-8 py-7">
              <FramePreview style={frame.id} color={frame.color} />
            </div>
            <div className="border-t border-gf-line p-5">
              <h2 className="m-0 text-lg font-bold text-gf-brown-900">{t[frame.id]}</h2>
              <p className="mb-5 mt-1.5 min-h-11 text-sm leading-5 text-gf-muted">
                {t[`${frame.id}Description`]}
              </p>
              <Link
                href={`/photobooth/studio?frame=${frame.id}`}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gf-pink-500 px-5 py-2.5 text-sm font-semibold text-gf-brown-900 no-underline transition-colors hover:bg-gf-pink-600"
              >
                {t.chooseStyle}
                <ArrowRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-6 flex items-start gap-2.5 border-t border-gf-line pt-5 text-xs leading-5 text-gf-muted">
        <LockKeyhole className="mt-0.5 shrink-0 text-gf-brown-500" size={16} />
        <span>{t.privacyNote}</span>
      </div>
    </div>
  )
}
