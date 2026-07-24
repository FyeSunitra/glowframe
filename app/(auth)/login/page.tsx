'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { getPageText } from '@/lib/menuI18n';
import { BrandLogo } from '@/components/common/BrandLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAppStore((s) => s.login);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const router = useRouter();
  const t = getPageText(locale, 'login');

  function handleSubmit() {
    login(email || 'you@example.com');
    router.push('/home');
  }

  return (
    <div className="grid w-full max-w-[1180px] grid-cols-2 items-center gap-10 max-[900px]:grid-cols-1">
      <div className="flex flex-col items-start gap-[6px]">
        <BrandLogo variant="auth" priority />
        <p className="text-gf-pink-300 opacity-[0.75] text-[15px] [margin-top:18px] max-w-[340px]">
          {t.intro}
        </p>
      </div>

      <div>
        <div className="flex justify-between [align-items:baseline] [margin-bottom:22px] gap-[14px]">
          <h1 className="text-[26px] text-gf-pink-100 [margin:0] font-semibold">{t.title}</h1>
          <div className="text-gf-pink-300 text-[15px] flex items-center gap-[12px]">
            <button onClick={() => setLocale(locale === 'th' ? 'en' : 'th')} className="cursor-pointer rounded-full border border-gf-pink-300 bg-transparent px-2.5 py-[5px] text-xs font-bold text-gf-pink-100">
              {locale === 'th' ? 'EN' : 'TH'}
            </button>
            <span>{t.or} <Link href="/signup" className="text-gf-pink-100 underline">{t.signup}</Link></span>
          </div>
        </div>

        <button onClick={handleSubmit} className="mb-5 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-0 bg-white px-5 py-3.5 text-[15px] font-medium text-[#3c3c3c]">
          <GoogleIcon />
          {t.google}
        </button>

        <div className="my-2 mt-4 text-[14.5px] text-[#F2D7DC] opacity-90">{t.emailLabel}</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          className="w-full rounded-[16px] border-0 bg-gf-cream px-[18px] py-[15px] text-[15px] text-gf-ink outline-none"
        />

        <div className="my-2 mt-4 text-[14.5px] text-[#F2D7DC] opacity-90">{t.password}</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.passwordPlaceholder}
          className="w-full rounded-[16px] border-0 bg-gf-cream px-[18px] py-[15px] text-[15px] text-gf-ink outline-none"
        />

        <div className="text-right text-[13px] text-gf-pink-300 [margin-top:8px] cursor-pointer">
          {t.forgot}
        </div>

        <div className="[margin-top:22px]">
          <button onClick={handleSubmit} className="w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-900">{t.submit}</button>
        </div>

        <p className="text-[12.5px] text-gf-pink-300 opacity-[0.8] [margin-top:18px] [line-height:1.6]">
          {t.terms}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>
  );
}
