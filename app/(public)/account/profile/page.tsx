'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AccountTabs } from '../AccountTabs';
import { getPageText } from '@/lib/menuI18n';
import { profileService } from '@/services/profile';
import type { ProfileData, UpdateProfilePayload } from '@/types/profile';
import { cn } from '@/lib/utils';

const EMPTY_FORM: UpdateProfilePayload = {
  displayName: '',
  fullName: '',
  phone: '',
};

export default function AccountProfilePage() {
  const locale = useAppStore((state) => state.locale);
  const setUser = useAppStore((state) => state.setUser);
  const accountText = getPageText(locale, 'account');
  const t = accountText.profile;
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<UpdateProfilePayload>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  async function loadProfile() {
    setIsLoading(true);
    setLoadFailed(false);
    const result = await profileService.get();
    setIsLoading(false);

    if (!result.success) {
      setLoadFailed(true);
      return;
    }

    setProfile(result.data);
    setForm({
      displayName: result.data.displayName,
      fullName: result.data.fullName,
      phone: result.data.phone,
    });
  }

  useEffect(() => {
    let active = true;

    void profileService.get().then((result) => {
      if (!active) return;
      setIsLoading(false);

      if (!result.success) {
        setLoadFailed(true);
        return;
      }

      setProfile(result.data);
      setForm({
        displayName: result.data.displayName,
        fullName: result.data.fullName,
        phone: result.data.phone,
      });
    });

    return () => {
      active = false;
    };
  }, []);

  const initials = useMemo(() => {
    const source = form.displayName.trim() || profile?.email || 'G';
    return source.slice(0, 2).toUpperCase();
  }, [form.displayName, profile?.email]);

  function updateField(field: keyof UpdateProfilePayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    if (!profile) return;
    setForm({
      displayName: profile.displayName,
      fullName: profile.fullName,
      phone: profile.phone,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      displayName: form.displayName.trim(),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
    };

    if (!payload.displayName) {
      showToast(t.displayNameRequired);
      return;
    }
    if (payload.phone && !/^[0-9+\-()\s]{8,20}$/.test(payload.phone)) {
      showToast(t.invalidPhone);
      return;
    }

    setIsSaving(true);
    const result = await profileService.update(payload);
    setIsSaving(false);

    if (!result.success) {
      showToast(t.saveFailed);
      return;
    }

    setProfile(result.data);
    setForm({
      displayName: result.data.displayName,
      fullName: result.data.fullName,
      phone: result.data.phone,
    });
    setUser({
      displayName: result.data.displayName,
      fullName: result.data.fullName,
      email: result.data.email,
      phone: result.data.phone,
      emailVerified: result.data.emailVerified,
      phoneVerified: result.data.phoneVerified,
      idVerified: result.data.identityVerified,
    });
    showToast(t.saved);
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[accountText.myAccount, t.breadcrumb]} />
      <AccountTabs active="profile" />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-gf-muted">
          {t.loading}
        </div>
      ) : loadFailed || !profile ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
          <p className="m-0 text-sm text-gf-muted">{t.loadFailed}</p>
          <button
            type="button"
            onClick={() => void loadProfile()}
            className="cursor-pointer rounded-full border border-gf-brown-300 bg-white px-5 py-2.5 text-sm font-semibold text-gf-brown-800"
          >
            {t.retry}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] bg-white shadow-[var(--gf-shadow)]">
          <header className="flex items-center gap-4 border-b border-gf-line px-5 py-5 sm:px-7">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gf-pink-100 text-lg font-bold text-gf-brown-800">
              {profile.profileImageUrl ? (
                <Image
                  src={profile.profileImageUrl}
                  alt={profile.displayName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <h1 className="m-0 text-[19px] font-bold text-gf-brown-900">{t.title}</h1>
              <p className="mb-0 mt-1 text-sm leading-6 text-gf-muted">{t.subtitle}</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-8 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section>
              <h2 className="m-0 flex items-center gap-2 text-[15px] font-bold text-gf-brown-900">
                <UserRound size={18} className="text-gf-pink-600" />
                {t.personalInformation}
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label={t.displayName} htmlFor="profile-display-name">
                  <Input
                    id="profile-display-name"
                    value={form.displayName}
                    maxLength={120}
                    placeholder={t.displayNamePlaceholder}
                    onChange={(event) => updateField('displayName', event.target.value)}
                  />
                </Field>

                <Field label={t.fullName} htmlFor="profile-full-name">
                  <Input
                    id="profile-full-name"
                    value={form.fullName}
                    maxLength={160}
                    placeholder={t.fullNamePlaceholder}
                    autoComplete="name"
                    onChange={(event) => updateField('fullName', event.target.value)}
                  />
                </Field>

                <Field label={t.email} htmlFor="profile-email">
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gf-muted" />
                    <Input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      readOnly
                      aria-readonly="true"
                      className="bg-gf-pink-50 pl-10"
                    />
                  </div>
                </Field>

                <Field label={t.phone} htmlFor="profile-phone">
                  <div className="relative">
                    <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gf-muted" />
                    <Input
                      id="profile-phone"
                      type="tel"
                      value={form.phone}
                      maxLength={20}
                      placeholder={t.phonePlaceholder}
                      autoComplete="tel"
                      className="pl-10"
                      onChange={(event) => updateField('phone', event.target.value)}
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-11 cursor-pointer rounded-full border-0 bg-gf-brown-800 px-6 py-2.5 text-sm font-semibold text-gf-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? t.saving : t.save}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="min-h-11 cursor-pointer rounded-full border border-gf-brown-300 bg-white px-6 py-2.5 text-sm font-semibold text-gf-brown-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t.reset}
                </button>
              </div>
            </section>

            <aside className="border-t border-gf-line pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <h2 className="m-0 flex items-center gap-2 text-[15px] font-bold text-gf-brown-900">
                <ShieldCheck size={18} className="text-gf-pink-600" />
                {t.accountStatus}
              </h2>
              <div className="mt-4 divide-y divide-gf-line">
                <VerificationRow
                  label={t.emailVerification}
                  verified={profile.emailVerified}
                  verifiedText={t.verified}
                  unverifiedText={t.notVerified}
                />
                <VerificationRow
                  label={t.phoneVerification}
                  verified={profile.phoneVerified}
                  verifiedText={t.verified}
                  unverifiedText={t.notVerified}
                />
                <VerificationRow
                  label={t.identityVerification}
                  verified={profile.identityVerified}
                  verifiedText={t.verified}
                  unverifiedText={t.notVerified}
                />
              </div>
            </aside>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor} className="mb-2">
        {label}
      </Label>
      {children}
      {hint && <p className="mb-0 mt-1.5 text-xs leading-5 text-gf-muted">{hint}</p>}
    </div>
  );
}

function VerificationRow({
  label,
  verified,
  verifiedText,
  unverifiedText,
}: {
  label: string;
  verified: boolean;
  verifiedText: string;
  unverifiedText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-gf-brown-700">{label}</span>
      <span
        className={cn(
          'flex shrink-0 items-center gap-1.5 font-semibold',
          verified ? 'text-emerald-700' : 'text-gf-muted',
        )}
      >
        {verified && <BadgeCheck size={16} />}
        {verified ? verifiedText : unverifiedText}
      </span>
    </div>
  );
}
