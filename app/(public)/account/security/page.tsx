'use client';

import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AccountTabs } from '../AccountTabs';
import { useAppStore } from '@/store/appStore';
import { getPageText } from '@/lib/menuI18n';
import { authService } from '@/services/auth';

export default function AccountSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locale = useAppStore((state) => state.locale);
  const accountText = getPageText(locale, 'account');
  const t = accountText.security;
  const { showToast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword) {
      showToast(t.required);
      return;
    }
    if (newPassword.length < 8) {
      showToast(t.passwordLength);
      return;
    }
    if (currentPassword === newPassword) {
      showToast(t.passwordSame);
      return;
    }

    setIsSubmitting(true);
    const result = await authService.changePassword({
      currentPassword,
      newPassword,
    });
    setIsSubmitting(false);

    if (!result.success) {
      showToast(
        result.error === 'Current password is incorrect.'
          ? t.currentPasswordInvalid
          : t.changeFailed,
      );
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    showToast(t.changed);
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[accountText.myAccount, t.breadcrumb]} />
      <AccountTabs active="security" />

      <div className="overflow-hidden rounded-[20px] bg-white shadow-[var(--gf-shadow)]">
        <header className="flex items-start gap-3 border-b border-gf-line px-5 py-5 sm:px-7">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gf-pink-100 text-gf-brown-800">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h1 className="m-0 text-[19px] font-bold text-gf-brown-900">{t.title}</h1>
            <p className="mb-0 mt-1 text-sm leading-6 text-gf-muted">{t.subtitle}</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="max-w-[620px] space-y-5 px-5 py-6 sm:px-7">
          <PasswordField
            id="current-password"
            label={t.currentPassword}
            placeholder={t.currentPasswordPlaceholder}
            value={currentPassword}
            visible={showCurrentPassword}
            onChange={setCurrentPassword}
            onToggle={() => setShowCurrentPassword((visible) => !visible)}
            showLabel={t.showPassword}
            hideLabel={t.hidePassword}
            autoComplete="current-password"
          />
          <PasswordField
            id="new-password"
            label={t.newPassword}
            placeholder={t.newPasswordPlaceholder}
            value={newPassword}
            visible={showNewPassword}
            onChange={setNewPassword}
            onToggle={() => setShowNewPassword((visible) => !visible)}
            showLabel={t.showPassword}
            hideLabel={t.hidePassword}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 cursor-pointer rounded-full border-0 bg-gf-brown-800 px-6 py-2.5 text-sm font-semibold text-gf-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t.changing : t.change}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  visible,
  onChange,
  onToggle,
  showLabel,
  hideLabel,
  autoComplete,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
  autoComplete: string;
}) {
  const visibilityLabel = visible ? hideLabel : showLabel;

  return (
    <div>
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-12"
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visibilityLabel}
          title={visibilityLabel}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-gf-brown-700 hover:bg-gf-pink-100"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
