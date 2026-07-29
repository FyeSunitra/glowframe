'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogIconTitle,
} from '@/components/ui/dialog'
import { policyService } from '@/services/policy'
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'
import type {
  PolicyContext,
  RequiredPolicy,
  RequiredPolicyType,
} from '@/types/policy'

interface PolicyModalProps {
  open: boolean
  policyType: RequiredPolicyType | null
  context?: PolicyContext
  onOpenChange: (open: boolean) => void
}

export function PolicyModal({
  open,
  policyType,
  context = 'signup',
  onOpenChange,
}: PolicyModalProps) {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'signup')
  const [policies, setPolicies] = useState<RequiredPolicy[] | null>(null)
  const [loadedLocale, setLoadedLocale] = useState<'th' | 'en' | null>(null)
  const [loadedContext, setLoadedContext] = useState<PolicyContext | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const requestStarted = useRef(false)

  useEffect(() => {
    if (
      !open
      || (
        policies !== null
        && loadedLocale === locale
        && loadedContext === context
      )
      || requestStarted.current
    ) return
    requestStarted.current = true
    setLoadFailed(false)
    setPolicies(null)

    policyService.listRequired({ locale, context }).then((result) => {
      if (result.success) {
        setPolicies(result.data)
        setLoadedLocale(locale)
        setLoadedContext(context)
      } else {
        setLoadFailed(true)
      }
      requestStarted.current = false
    })
  }, [context, loadedContext, loadedLocale, locale, open, policies])

  const policy = useMemo(
    () => policies?.find((item) => item.type === policyType),
    [policies, policyType],
  )

  if (!policyType) return null

  const policyLabels: Record<RequiredPolicyType, string> = {
    termsOfService: t.termsAndConditions,
    privacyPolicy: t.privacyPolicy,
    rentalAgreement: t.rentalPolicy,
    paymentPolicy: t.paymentPolicy,
  }
  const body = policy?.body.trim() || t.policyFallback[policyType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-gf-cream p-0 sm:h-[min(820px,calc(100vh-40px))] sm:w-[calc(100vw-40px)] sm:max-w-[840px] lg:max-w-[960px]">
        <DialogHeader className="border-b border-gf-line px-6 py-5">
          <DialogIconTitle
            icon={<FileText size={19} />}
            className="text-xl font-semibold text-gf-brown-900"
          >
            {policyLabels[policyType]}
          </DialogIconTitle>
          <DialogDescription className="text-sm text-gf-muted">
            {policy
              ? `${t.policyVersion} ${policy.version}${
                  policy.effectiveAt
                    ? ` · ${t.policyEffectiveDate} ${new Intl.DateTimeFormat(
                        locale === 'th' ? 'th-TH' : 'en-GB',
                        { dateStyle: 'medium' },
                      ).format(new Date(policy.effectiveAt))}`
                    : ''
                }`
              : policyLabels[policyType]}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5 text-sm leading-7 text-gf-brown-800">
          {policies === null && !loadFailed ? (
            <div className="py-12 text-center text-gf-muted">{t.policyLoading}</div>
          ) : (
            <>
              {loadFailed && (
                <p className="mb-4 text-sm font-medium text-gf-red">
                  {t.policyUnavailable}
                </p>
              )}
              <div className="whitespace-pre-wrap">{body}</div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-gf-line bg-gf-cream px-6 py-4">
          <DialogClose className="w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-5 py-2.5 font-semibold text-gf-brown-900 sm:w-auto">
            {t.policyClose}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
