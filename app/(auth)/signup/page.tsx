'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { getPageText } from '@/lib/menuI18n';
import { BrandLogo } from '@/components/common/BrandLogo';
import { PolicyModal } from '@/components/auth/PolicyModal';
import type { RequiredPolicyType } from '@/types/policy';
import { authService } from '@/services/auth';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [policyType, setPolicyType] = useState<RequiredPolicyType | null>(null);
  const login = useAppStore((s) => s.login);
  const setPendingSignupEmail = useAppStore((s) => s.setPendingSignupEmail);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const router = useRouter();
  const { showToast } = useToast();
  const t = getPageText(locale, 'signup');

  function validateAgreement() {
    if (!agreed) {
      showToast(t.agreeToast);
      return false;
    }

    return true;
  }

  function handleGoogleSignup() {
    showToast(t.googleUnavailable);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
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
    if (password.length < 8) {
      showToast(t.passwordLength);
      return;
    }
    if (password !== confirmPassword) {
      showToast(t.passwordMismatch);
      return;
    }
    if (!validateAgreement()) return;

    setIsSubmitting(true);
    const result = await authService.signup({
      email: normalizedEmail,
      password,
    });
    setIsSubmitting(false);

    if (!result.success) {
      showToast(
        result.code === 'email_already_registered'
          ? t.emailAlreadyRegistered
          : result.error || t.signupFailed,
      );
      return;
    }

    if (result.data.user && !result.data.requiresVerification) {
      login(result.data.user);
      setPendingSignupEmail('');
      router.replace('/home');
      return;
    }

    setPendingSignupEmail(normalizedEmail);
    router.push('/signup/verify');
  }

  return (
    <div className="grid w-full max-w-[1180px] grid-cols-2 items-center gap-10 max-[900px]:grid-cols-1">
      <div className="flex flex-col items-start gap-[6px]">
        <BrandLogo variant="auth" priority />
        {/* <p className="text-gf-pink-300 opacity-[0.75] text-[15px] [margin-top:18px] max-w-[340px]">
          {t.intro}
        </p> */}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-between [align-items:baseline] [margin-bottom:22px] gap-[14px]">
          <h1 className="text-[26px] text-gf-pink-100 [margin:0] font-semibold">{t.title}</h1>
          <div className="text-gf-pink-300 text-[15px] flex items-center gap-[12px]">
            <button onClick={() => setLocale(locale === 'th' ? 'en' : 'th')} className="cursor-pointer rounded-full border border-gf-pink-300 bg-transparent px-2.5 py-[5px] text-xs font-bold text-gf-pink-100">
              {locale === 'th' ? 'EN' : 'TH'}
            </button>
            <span>{t.or} <Link href="/login" className="text-gf-pink-100 underline">{t.login}</Link></span>
          </div>
        </div>

        <button type="button" onClick={handleGoogleSignup} className="mb-5 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-0 bg-white px-5 py-3.5 text-[15px] font-medium text-[#3c3c3c]">
          <GoogleIcon />
          {t.google}
        </button>

        <div className="my-2 mt-4 text-[14.5px] text-[#F2D7DC] opacity-90">{t.emailLabel}</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          className="auth-input w-full rounded-[16px] border-0 bg-gf-cream px-[18px] py-[15px] text-[15px] text-gf-ink outline-none"
        />

        <div className="my-2 mt-4 text-[14.5px] text-[#F2D7DC] opacity-90">{t.password}</div>
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder={t.passwordPlaceholder}
          autoComplete="new-password"
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
        />

        <div className="my-2 mt-4 text-[14.5px] text-[#F2D7DC] opacity-90">{t.confirmPassword}</div>
        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder={t.confirmPasswordPlaceholder}
          autoComplete="new-password"
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
        />

        <div className="flex gap-[10px] items-start [margin-top:10px] text-[12.5px] text-gf-pink-300 opacity-[0.9] [line-height:1.5]">
          <input type="checkbox" id="su-agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="[margin-top:3px]" />
          <div>
            <label htmlFor="su-agree" className="cursor-pointer">{t.agreePrefix} </label>
            <PolicyLink onClick={() => setPolicyType('termsOfService')}>{t.termsAndConditions}</PolicyLink>
            {', '}
            <PolicyLink onClick={() => setPolicyType('privacyPolicy')}>{t.privacyPolicy}</PolicyLink>
            {` ${t.agreeAnd} `}
            <PolicyLink onClick={() => setPolicyType('rentalAgreement')}>{t.rentalPolicy}</PolicyLink>
          </div>
        </div>

        <div className="[margin-top:22px]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t.submitting : t.submit}
          </button>
        </div>

        <p className="text-[12.5px] text-gf-pink-300 opacity-[0.8] [margin-top:18px] [line-height:1.6]">
          {t.terms}
        </p>
      </form>

      <PolicyModal
        open={policyType !== null}
        policyType={policyType}
        onOpenChange={(open) => {
          if (!open) setPolicyType(null);
        }}
      />
    </div>
  );
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  showLabel: string;
  hideLabel: string;
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  showLabel,
  hideLabel,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const visibilityLabel = visible ? hideLabel : showLabel;

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="auth-input w-full rounded-[16px] border-0 bg-gf-cream py-[15px] pl-[18px] pr-[52px] text-[15px] text-gf-ink outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visibilityLabel}
        title={visibilityLabel}
        className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-gf-brown-700 transition-colors hover:bg-gf-pink-100"
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}

function PolicyLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-gf-pink-100 underline underline-offset-2"
    >
      {children}
    </button>
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
