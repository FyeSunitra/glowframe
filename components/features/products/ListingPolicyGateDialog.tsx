'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, FileText, LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogIconTitle,
} from '@/components/ui/dialog'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { policyService } from '@/services/policy'
import { useAppStore } from '@/store/appStore'

interface ListingPolicyGateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccepted: () => void
}

export function ListingPolicyGateDialog({
  open,
  onOpenChange,
  onAccepted,
}: ListingPolicyGateDialogProps) {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'listing')
  const [accepted, setAccepted] = useState(false)
  const {
    data: policies = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['policies', 'listing', locale],
    queryFn: async () => unwrapApiResponse(await policyService.listRequired({ locale, context: 'listing' })),
    enabled: open,
  })
  const policy = policies.find((item) => item.type === 'listingPolicy')
  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!policy) throw new Error('Listing policy is unavailable.')
      return unwrapApiResponse(await policyService.accept(policy.id))
    },
    onSuccess: onAccepted,
  })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setAccepted(false)
      acceptMutation.reset()
    }
    onOpenChange(nextOpen)
  }

  const effectiveDate = policy?.effectiveAt
    ? new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
        dateStyle: 'medium',
      }).format(new Date(policy.effectiveAt))
    : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="grid h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-0 overflow-hidden p-0 sm:h-[min(780px,calc(100vh-40px))] sm:max-w-[760px]"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-gf-line px-5 py-5 sm:px-7">
          <DialogIconTitle icon={<FileText size={20} />} className="text-lg text-gf-brown-900 sm:text-xl">
            {t.listingPolicyTitle}
          </DialogIconTitle>
          <DialogDescription className="mt-3 leading-6 text-gf-muted">
            {t.listingPolicyDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {isLoading ? (
            <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-gf-muted">
              <LoaderCircle className="animate-spin" size={17} />
              {t.listingPolicyLoading}
            </div>
          ) : isError || !policy ? (
            <p className="m-0 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t.listingPolicyUnavailable}
            </p>
          ) : (
            <article>
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gf-muted">
                <span>{t.listingPolicyVersion} {policy.version}</span>
                {effectiveDate && <span>{t.listingPolicyEffectiveDate} {effectiveDate}</span>}
              </div>
              <h2 className="m-0 text-base font-bold text-gf-brown-900">{policy.title}</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gf-brown-800">
                {policy.body}
              </div>
            </article>
          )}
        </div>

        <div className="border-t border-gf-line px-5 py-4 sm:px-7">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-gf-brown-800">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              disabled={!policy || isLoading || isError || acceptMutation.isPending}
              className="mt-1 size-4 shrink-0 accent-[var(--gf-pink-500)]"
            />
            <span>{t.listingPolicyConsent}</span>
          </label>
          {acceptMutation.isError && (
            <p className="mb-0 mt-3 text-sm text-red-700">{t.listingPolicyAcceptFailed}</p>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-4 sm:px-7">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={acceptMutation.isPending}>
            {t.listingPolicyClose}
          </Button>
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={!accepted || !policy || isLoading || isError || acceptMutation.isPending}
          >
            {acceptMutation.isPending ? <LoaderCircle className="animate-spin" /> : <Check />}
            {t.listingPolicyContinue}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
