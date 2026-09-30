'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ArrowRight, DollarSign, Camera } from 'lucide-react';
import { FramePreview } from '@/components/features/photobooth/FramePreview';
import { unwrapApiResponse } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { getPageText } from '@/lib/menuI18n';
import { photoboothService } from '@/services/photobooth';
import type { PhotoboothFrame } from '@/types/photobooth';


export default function HomePage() {
  const t = getPageText(useAppStore((s) => s.locale), 'home');
  const { data: bannerFrames = [] } = useQuery({
    queryKey: ['photobooth-home-frames'],
    queryFn: async () => {
      const available = unwrapApiResponse(await photoboothService.list());
      const detailed = available.filter((frame) => Math.min(frame.canvasWidth, frame.canvasHeight) >= 400);
      const remaining = available.filter((frame) => Math.min(frame.canvasWidth, frame.canvasHeight) < 400);
      const selected: PhotoboothFrame[] = [];
      for (const pool of [detailed, remaining]) {
        while (pool.length > 0 && selected.length < 2) {
          selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
      }
      return selected;
    },
    retry: false,
  });

// ---------------------------------------------------------------
// BannerFrame: only change is removing the drop shadow class
// ---------------------------------------------------------------
function BannerFrame({ frame }: { frame: PhotoboothFrame }) {
  return (
    <div
      className="relative max-h-full max-w-full overflow-hidden"
      style={{
        aspectRatio: `${frame.canvasWidth}/${frame.canvasHeight}`,
        width: '100%',
      }}
    >
      {frame.slots.map((slot) => (
        <div
          key={slot.index}
          className="absolute bg-[#fff7f5]"
          style={{
            left: `${slot.x * 100}%`,
            top: `${slot.y * 100}%`,
            width: `${slot.width * 100}%`,
            height: `${slot.height * 100}%`,
          }}
        />
      ))}
      <Image src={frame.overlayUrl} alt="" fill unoptimized className="object-contain" sizes="(max-width: 640px) 150px, 200px" />
    </div>
  );
}

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['Home']} />
      <section className="relative mb-[22px] min-h-[300px] overflow-hidden rounded-[8px] bg-gf-brown-800 text-gf-pink-100">
        <div className="relative z-20 flex min-h-[300px] min-w-0 flex-col items-start px-6 pb-7 pt-10 sm:px-10 sm:pb-9 sm:pt-11 lg:px-14">
          <h1 className="m-0 font-[var(--font-poppins)] text-[30px] font-semibold leading-[1.1] tracking-tight text-gf-pink-100 sm:text-[44px]">
            Photobooth
          </h1>

          <p className="mb-0 mt-1.5 font-[var(--font-caveat)] text-[24px] font-semibold leading-none text-gf-pink-300 sm:mt-2 sm:text-[32px]">
            Let's Snap
          </p>
          <Link
            href="/photobooth"
            className="mt-auto inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-gf-pink-300 px-5 py-2.5 text-sm font-bold text-gf-brown-900 no-underline transition-colors hover:bg-gf-pink-100"
          >
            {t.photoboothCta}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="pointer-events-none absolute inset-y-5 right-6 isolate z-0 w-[170px] sm:right-10 sm:w-[340px]">
          <div
            className={`absolute top-1/2 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.07] sm:h-[310px] sm:w-[310px] ${
              bannerFrames.length === 1 ? 'left-[51%] sm:left-1/2' : 'left-[62%] sm:left-[57%]'
            }`}
          />

          {bannerFrames.length ? bannerFrames.map((frame, index) => (
            <div
              key={frame.id}
              className={index === 0 && bannerFrames.length > 1
                ? 'absolute left-[17%] top-[60px] flex h-[125px] w-[94px] -rotate-12 items-center justify-center sm:top-5 sm:h-[220px] sm:w-[165px]'
                : `absolute top-[55px] z-10 flex h-[150px] w-[112px] rotate-6 items-center justify-center sm:top-[5px] sm:h-[250px] sm:w-[188px] ${bannerFrames.length > 1 ? 'left-[42%]' : 'left-[18%] sm:left-[22%]'}`}
            >
              <BannerFrame frame={frame} />
            </div>
          )) : (
            <>
              <div className="absolute left-[17%] top-[60px] h-[125px] w-[94px] -rotate-12 sm:top-5 sm:h-[220px] sm:w-[165px]">
                <FramePreview style="classic" color="#fffdf8" count={2} layout="grid" className="h-full" />
              </div>
              <div className="absolute left-[42%] top-[55px] z-10 h-[150px] w-[112px] rotate-6 sm:top-[5px] sm:h-[250px] sm:w-[188px]">
                <FramePreview style="classic" color="#f4ccd5" count={4} layout="grid" className="h-full" />
              </div>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2">
        <div className="bg-gf-brown-800 rounded-[22px] text-gf-pink-100 [padding:44px_30px] text-center relative overflow-hidden">
          <div className="opacity-[0.6] text-[14px]">{t.ownerEyebrow}</div>
          <h2 className="font-[var(--font-poppins)] [font-style:italic] font-semibold text-[26px] [margin:6px_0_22px]">{t.ownerHeadline}</h2>
          <div className="w-[74px] h-[74px] [margin:0_auto_22px] text-gf-pink-300">
            <DollarSign size={74} strokeWidth={1.2} />
          </div>
          <Link href="/list-camera" className="text-[19px] font-bold underline text-[#f6dbe0]">{t.ownerCta}</Link>
          <p className="[margin-top:10px] text-[13px] opacity-[0.65]">{t.ownerSub}</p>
        </div>

        <div className="bg-gf-brown-800 rounded-[22px] text-gf-pink-100 [padding:44px_30px] text-center relative overflow-hidden">
          <div className="opacity-[0.6] text-[14px]">{t.renterEyebrow}</div>
          <h2 className="font-[var(--font-poppins)] [font-style:italic] font-semibold text-[26px] [margin:6px_0_22px]">{t.renterHeadline}</h2>
          <div className="w-[74px] h-[74px] [margin:0_auto_22px] text-gf-pink-300">
            <Camera size={74} strokeWidth={1.2} />
          </div>
          <Link href="/for-rent" className="text-[19px] font-bold underline text-[#f6dbe0]">{t.renterCta}</Link>
          <p className="[margin-top:10px] text-[13px] opacity-[0.65]">{t.renterSub}</p>
        </div>
      </div>
    </div>
  );
}
