'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getPageText } from '@/lib/menuI18n';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const login = useAppStore((state) => state.login);
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const router = useRouter();
  const { showToast } = useToast();
  const t = getPageText(locale, 'login');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showToast(t.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showToast(t.invalidEmail);
      return;
    }
    if (!password) {
      showToast(t.passwordRequired);
      return;
    }

    setIsSubmitting(true);
    const result = await authService.login({ email: normalizedEmail, password });
    setIsSubmitting(false);

    if (!result.success) {
      showToast(result.error || t.loginFailed);
      return;
    }

    login(result.data.user);
    router.replace(result.data.user.role === 'admin' ? '/admin/dashboard' : '/for-rent');
  }

  return (
    <div className="grid w-full max-w-[1180px] grid-cols-2 items-center gap-10 max-[900px]:grid-cols-1">
      <div className="flex flex-col items-start gap-[6px]">
        <BrandLogo variant="auth" priority />
        {/* <p className="mt-[18px] max-w-[340px] text-[15px] text-gf-pink-300 opacity-75">
          {t.intro}
        </p> */}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-[22px] flex items-baseline justify-between gap-[14px]">
          <h1 className="m-0 text-[26px] font-semibold text-gf-pink-100">{t.title}</h1>
          <div className="flex items-center gap-3 text-[15px] text-gf-pink-300">
            <button
              type="button"
              onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
              className="cursor-pointer rounded-full border border-gf-pink-300 bg-transparent px-2.5 py-[5px] text-xs font-bold text-gf-pink-100"
            >
              {locale === 'th' ? 'EN' : 'TH'}
            </button>
            <span>
              {t.or}{' '}
              <Link href="/signup" className="text-gf-pink-100 underline">
                {t.signup}
              </Link>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => showToast(t.googleUnavailable)}
          className="mb-5 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-0 bg-white px-5 py-3.5 text-[15px] font-medium text-[#3c3c3c]"
        >
          <GoogleIcon />
          {t.google}
        </button>

        <label htmlFor="login-email" className="my-2 mt-4 block text-[14.5px] text-[#F2D7DC] opacity-90">
          {t.emailLabel}
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          className="w-full rounded-[16px] border-0 bg-gf-cream px-[18px] py-[15px] text-[15px] text-gf-ink outline-none"
        />

        <label htmlFor="login-password" className="my-2 mt-4 block text-[14.5px] text-[#F2D7DC] opacity-90">
          {t.password}
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={passwordVisible ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t.passwordPlaceholder}
            autoComplete="current-password"
            className="w-full rounded-[16px] border-0 bg-gf-cream py-[15px] pl-[18px] pr-[52px] text-[15px] text-gf-ink outline-none"
          />
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? t.hidePassword : t.showPassword}
            title={passwordVisible ? t.hidePassword : t.showPassword}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-gf-brown-700 hover:bg-gf-pink-100"
          >
            {passwordVisible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>

        {/* <div className="mt-2 cursor-pointer text-right text-[13px] text-gf-pink-300">
          {t.forgot}
        </div> */}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-[22px] w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t.submitting : t.submit}
        </button>

        <p className="mt-[18px] text-[12.5px] leading-relaxed text-gf-pink-300 opacity-80">
          {t.terms}
        </p>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>
  );
}
