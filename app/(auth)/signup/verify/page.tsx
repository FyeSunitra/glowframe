'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/common/BrandLogo'
import { getPageText } from '@/lib/menuI18n'
import { useToast } from '@/hooks/useToast'
import { useAppStore } from '@/store/appStore'
import { authService } from '@/services/auth'

const OTP_LENGTH = 8
const RESEND_SECONDS = 60

export default function SignupVerifyPage() {
  const [otp, setOtp] = useState(() => Array<string>(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const locale = useAppStore((state) => state.locale)
  const setLocale = useAppStore((state) => state.setLocale)
  const login = useAppStore((state) => state.login)
  const email = useAppStore((state) => state.pendingSignupEmail)
  const setPendingSignupEmail = useAppStore((state) => state.setPendingSignupEmail)
  const router = useRouter()
  const { showToast } = useToast()
  const t = getPageText(locale, 'signupOtp')

  useEffect(() => {
    if (!email) {
      showToast(t.emailMissing)
      router.replace('/signup')
    }
  }, [email, router, showToast, t.emailMissing])

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft])

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtp((current) => {
      const next = [...current]
      next[index] = digit
      return next
    })

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const digits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
      .split('')

    if (digits.length === 0) return

    const next = Array<string>(OTP_LENGTH).fill('')
    digits.forEach((digit, index) => {
      next[index] = digit
    })
    setOtp(next)
    inputRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus()
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (otp.some((digit) => !digit)) {
      showToast(t.invalidOtp)
      return
    }

    if (!email) return

    setIsVerifying(true)
    const result = await authService.verifyOtp({
      email,
      token: otp.join(''),
    })
    setIsVerifying(false)

    if (!result.success) {
      showToast(result.error || t.verifyFailed)
      return
    }

    setPendingSignupEmail('')
    login(result.data.user)
    showToast(t.verified)
    router.replace('/home')
  }

  async function handleResend() {
    if (secondsLeft > 0 || !email || isResending) return
    setIsResending(true)
    const result = await authService.resendOtp(email)
    setIsResending(false)

    if (!result.success) {
      showToast(result.error || t.resendFailed)
      return
    }

    setOtp(Array<string>(OTP_LENGTH).fill(''))
    setSecondsLeft(RESEND_SECONDS)
    inputRefs.current[0]?.focus()
    showToast(t.resent)
  }

  function handleChangeEmail() {
    setPendingSignupEmail('')
    router.replace('/signup')
  }

  return (
    <div className="grid w-full max-w-[1080px] grid-cols-2 items-center gap-12 max-[900px]:grid-cols-1">
      <div className="flex flex-col items-start gap-1.5">
        <BrandLogo variant="auth" priority />
        {/* <p className="mt-[18px] max-w-[340px] text-[15px] text-gf-pink-300 opacity-75">
          {t.intro}
        </p> */}
      </div>

      <form onSubmit={handleVerify} className="w-full">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gf-pink-100 text-gf-brown-800">
              <MailCheck size={21} />
            </div>
            <h1 className="m-0 whitespace-nowrap text-[24px] font-semibold text-gf-pink-100 sm:text-[26px]">
              {t.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
            className="cursor-pointer rounded-full border border-gf-pink-300 bg-transparent px-2.5 py-[5px] text-xs font-bold text-gf-pink-100"
          >
            {locale === 'th' ? 'EN' : 'TH'}
          </button>
        </div>

        <p className="mb-1 text-sm leading-6 text-gf-pink-300">
          {t.description}
        </p>
        <p className="mb-6 break-all text-[15px] font-semibold text-gf-pink-100">
          {email || t.fallbackEmail}
        </p>

        <label className="mb-2 block text-[14.5px] text-[#F2D7DC]">
          {t.otpLabel}
        </label>
        <div className="grid max-w-[560px] grid-cols-8 gap-1.5 sm:gap-2.5">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`${t.otpLabel} ${index + 1}`}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onPaste={handlePaste}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !digit && index > 0) {
                  inputRefs.current[index - 1]?.focus()
                }
              }}
              className="aspect-square min-w-0 rounded-[14px] border-2 border-transparent bg-gf-cream text-center text-xl font-semibold text-gf-brown-900 outline-none transition-colors focus:border-gf-pink-500"
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gf-pink-300">
          <span>{t.didNotReceive}</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > 0}
            className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-gf-pink-100 underline underline-offset-2 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
          >
            {secondsLeft > 0
              ? `${t.resendIn} ${secondsLeft} ${t.seconds}`
              : t.resend}
          </button>
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className="mt-6 w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isVerifying ? t.verifying : t.submit}
        </button>

        <button
          type="button"
          onClick={handleChangeEmail}
          className="mt-4 flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-[13px] font-medium text-gf-pink-300"
        >
          <ArrowLeft size={15} />
          {t.changeEmail}
        </button>
      </form>
    </div>
  )
}
