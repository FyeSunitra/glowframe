'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  CalendarDays,
  Camera,
  Check,
  Circle,
  ReceiptText,
  Truck,
} from 'lucide-react'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ProductMediaLightbox } from '@/components/features/products/ProductMediaLightbox'
import { BookingStatusBadge } from '../page'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn, money } from '@/lib/utils'
import { bookingService } from '@/services/bookings'
import { useAppStore } from '@/store/appStore'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ApiResponse } from '@/types/api'
import type {
  BookingEvidenceKind,
  OwnerBookingActionPayload,
  RenterBooking,
  RenterBookingActionPayload,
  RenterBookingStatus,
} from '@/types/booking'

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const locale = useAppStore((state) => state.locale)
  const userId = useAppStore((state) => state.user.id ?? 0)
  const t = getPageText(locale, 'myRentals')
  const bookingId = Number(id)

  const { data: booking, isLoading, isError } = useQuery<RenterBooking>({
    queryKey: ['bookings', 'mine', userId, bookingId],
    queryFn: async () => unwrapApiResponse(await bookingService.get(bookingId)),
    enabled: userId > 0 && Number.isSafeInteger(bookingId) && bookingId > 0,
  })

  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-gf-muted">{t.loading}</div>
  }
  if (isError || !booking) {
    return <div className="py-16 text-center text-sm text-gf-red">{t.notFound}</div>
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.title, `${t.bookingNo} ${booking.bookingNo}`]} />

      <section className="overflow-hidden rounded-[8px] bg-white shadow-[var(--gf-shadow)]">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gf-line p-5 sm:p-7">
          <div className="flex min-w-0 gap-4">
            <div className="relative size-[92px] shrink-0 overflow-hidden rounded-[8px] bg-gf-pink-100">
              {booking.product.imageUrl ? (
                <Image
                  src={booking.product.imageUrl}
                  alt={booking.product.name}
                  fill
                  priority
                  sizes="92px"
                  className="object-cover"
                />
              ) : (
                <Camera className="absolute inset-0 m-auto text-gf-brown-300" size={30} />
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="m-0 text-[19px] font-bold text-gf-brown-900">
                  {booking.product.name}
                </h1>
                <BookingStatusBadge
                  status={booking.status}
                  label={t.statuses[booking.status]}
                />
              </div>
              <div className="text-[13px] text-gf-muted">
                {t.bookingNo} {booking.bookingNo}
              </div>
              <Link
                href={`/for-rent/${booking.product.id}`}
                className="mt-2 inline-block text-[13px] font-semibold text-gf-brown-800 underline"
              >
                {t.viewProduct}
              </Link>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[12px] text-gf-muted">{t.total}</div>
            <div className="mt-1 text-[20px] font-bold text-gf-brown-900">
              {money(booking.total)} THB
            </div>
          </div>
        </header>

        <div className="border-b border-gf-line p-5 sm:p-7">
          <h2 className="mb-5 mt-0 text-[16px] font-bold text-gf-brown-900">
            {t.progress}
          </h2>
          <BookingTimeline booking={booking} labels={t} />
          <ExceptionNotice booking={booking} labels={t} />
        </div>

        <div className="grid grid-cols-2 divide-x divide-gf-line max-[760px]:grid-cols-1 max-[760px]:divide-x-0 max-[760px]:divide-y">
          <DetailSection title={t.rentalDetails} icon={<CalendarDays size={18} />}>
            <DetailRow label={t.rentalPeriod} value={`${dateFormatter.format(parseDate(booking.startDate))} - ${dateFormatter.format(parseDate(booking.endDate))}`} />
            <DetailRow label={t.duration} value={`${booking.rentalDays} ${t.days}`} />
            <DetailRow label={t.deliveryMethod} value={t.deliveryMethods[booking.deliveryMethod]} />
            {booking.viewerRole === 'owner' ? (
              <>
                <DetailRow label={t.renter} value={booking.renter.displayName} />
                {booking.renter.phone && (
                  <DetailRow label={t.renterPhone} value={booking.renter.phone} />
                )}
              </>
            ) : (
              <>
                <DetailRow label={t.owner} value={booking.owner.displayName} />
                {booking.owner.phone && (
                  <DetailRow label={t.ownerPhone} value={booking.owner.phone} />
                )}
              </>
            )}
          </DetailSection>

          <DetailSection title={t.paymentDetails} icon={<ReceiptText size={18} />}>
            <DetailRow label={t.rentalFee} value={`${money(booking.rentalFee)} THB`} />
            <DetailRow label={t.deliveryFee} value={`${money(booking.deliveryFee)} THB`} />
            <DetailRow label={t.deposit} value={`${money(booking.deposit)} THB`} />
            <DetailRow label={t.total} value={`${money(booking.total)} THB`} strong />
            {booking.payment && (
              <>
                <DetailRow label={t.paymentStatus} value={t.paymentStatuses[booking.payment.status]} />
                <DetailRow label={t.proofFile} value={booking.payment.proofFileName ?? '-'} />
                {booking.payment.account && (
                  <DetailRow
                    label={t.transferredTo}
                    value={`${booking.payment.account.bankName} · ${booking.payment.account.accountNumber}`}
                  />
                )}
              </>
            )}
          </DetailSection>
        </div>

        {(booking.delivery?.trackingNumber || booking.delivery?.readyForPickupAt) && (
          <div className="border-t border-gf-line p-5 sm:p-7">
            <h2 className="mb-4 mt-0 flex items-center gap-2 text-[16px] font-bold text-gf-brown-900">
              <Truck size={18} />
              {t.deliveryTracking}
            </h2>
            <DetailRow
              label={t.shippingMethodLabel}
              value={t.deliveryMethods[booking.delivery.method]}
            />
            {booking.delivery.providerName && (
              <DetailRow label={t.provider} value={booking.delivery.providerName} />
            )}
            {booking.delivery.trackingNumber && (
              <DetailRow label={t.trackingNumber} value={booking.delivery.trackingNumber} strong />
            )}
            {booking.delivery.readyForPickupAt && (
              <DetailRow label={t.readyAt} value={dateFormatter.format(new Date(booking.delivery.readyForPickupAt))} />
            )}
            {booking.delivery.note && (
              <DetailRow label={t.note} value={booking.delivery.note} />
            )}
            {booking.delivery.evidenceUrl && (
              <EvidenceImage
                url={booking.delivery.evidenceUrl}
                alt={t.deliveryEvidence}
              />
            )}
          </div>
        )}

        {booking.return && (
          <div className="border-t border-gf-line p-5 sm:p-7">
            <h2 className="mb-4 mt-0 text-[16px] font-bold text-gf-brown-900">
              {t.returnDetails}
            </h2>
            <DetailRow label={t.returnStatus} value={booking.return.status} />
            {booking.return.method && (
              <DetailRow
                label={t.returnMethodLabel}
                value={t.deliveryMethods[booking.return.method]}
              />
            )}
            {booking.return.providerName && (
              <DetailRow label={t.returnProvider} value={booking.return.providerName} />
            )}
            {booking.return.trackingNumber && (
              <DetailRow label={t.trackingNumber} value={booking.return.trackingNumber} />
            )}
            {booking.return.note && (
              <DetailRow label={t.returnNote} value={booking.return.note} />
            )}
            {booking.return.evidenceUrl && (
              <EvidenceImage
                url={booking.return.evidenceUrl}
                alt={t.returnEvidence}
              />
            )}
            {booking.return.damageDescription && (
              <DetailRow label={t.damageDescriptionLabel} value={booking.return.damageDescription} />
            )}
            {booking.return.damageAmount > 0 && (
              <DetailRow label={t.damageAmountLabel} value={`${money(booking.return.damageAmount)} THB`} />
            )}
            {booking.return.adminDecision && (
              <>
                <DetailRow
                  label={t.damageDecisionLabel}
                  value={t.damageDecisionLabels[booking.return.adminDecision]}
                />
                <DetailRow
                  label={t.approvedDamageAmountLabel}
                  value={`${money(booking.return.approvedDamageAmount ?? 0)} THB`}
                  strong
                />
                {booking.return.adminDecisionNote && (
                  <DetailRow
                    label={t.damageDecisionNoteLabel}
                    value={booking.return.adminDecisionNote}
                  />
                )}
              </>
            )}
            {booking.return.damageEvidenceUrl && (
              <EvidenceImage
                url={booking.return.damageEvidenceUrl}
                alt={t.damageEvidence}
              />
            )}
          </div>
        )}

        <BookingActions booking={booking} labels={t} userId={userId} />
      </section>
    </div>
  )
}

type RentalLabels = ReturnType<typeof getPageText<'myRentals'>>
type ConfirmAction =
  | 'start_preparing'
  | 'ready_for_pickup'
  | 'confirm_received'
  | 'confirm_return'

function BookingActions({
  booking,
  labels,
  userId,
}: {
  booking: RenterBooking
  labels: RentalLabels
  userId: number
}) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [shipOpen, setShipOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [damageOpen, setDamageOpen] = useState(false)
  const [shippingMethod, setShippingMethod] = useState<
    'messenger' | 'shipping'
  >(booking.deliveryMethod === 'shipping' ? 'shipping' : 'messenger')
  const [providerName, setProviderName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingNote, setShippingNote] = useState('')
  const [shippingEvidence, setShippingEvidence] = useState<File | null>(null)
  const [returnMethod, setReturnMethod] = useState<
    'pickup' | 'messenger' | 'shipping'
  >(booking.deliveryMethod)
  const [returnProvider, setReturnProvider] = useState('')
  const [returnTracking, setReturnTracking] = useState('')
  const [returnNote, setReturnNote] = useState('')
  const [returnEvidence, setReturnEvidence] = useState<File | null>(null)
  const [damageDescription, setDamageDescription] = useState('')
  const [damageAmount, setDamageAmount] = useState('')
  const [damageEvidence, setDamageEvidence] = useState<File | null>(null)

  const actionMutation = useMutation({
    mutationFn: (operation: () => Promise<RenterBooking>) => operation(),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['bookings', 'mine', userId, booking.id],
        updated,
      )
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] })
      showToast(labels.actionUpdated)
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : labels.actionFailed)
    },
  })

  const canStartPreparing =
    booking.viewerRole === 'owner' &&
    booking.status === 'paymentApproved'
  const canPrepareHandover =
    booking.viewerRole === 'owner' &&
    booking.status === 'preparing'
  const canReviewReturn =
    booking.viewerRole === 'owner' &&
    booking.status === 'returnPending' &&
    booking.return?.status === 'renterReturned'
  const canConfirmReceived =
    booking.viewerRole === 'renter' &&
    (booking.status === 'readyForPickup' || booking.status === 'shipped')
  const canRequestReturn =
    booking.viewerRole === 'renter' &&
    booking.status === 'active'
  const hasAction =
    canStartPreparing ||
    canPrepareHandover ||
    canReviewReturn ||
    canConfirmReceived ||
    canRequestReturn

  if (!hasAction) return null

  function runOwnerAction(payload: OwnerBookingActionPayload) {
    actionMutation.mutate(async () =>
      unwrapApiResponse(await bookingService.ownerAction(booking.id, payload)),
    )
  }

  function runRenterAction(payload: RenterBookingActionPayload) {
    actionMutation.mutate(async () =>
      unwrapApiResponse(await bookingService.renterAction(booking.id, payload)),
    )
  }

  function confirmSelectedAction() {
    if (confirmAction === 'start_preparing') {
      runOwnerAction({ action: 'start_preparing' })
    } else if (confirmAction === 'ready_for_pickup') {
      runOwnerAction({ action: 'ready_for_pickup' })
    } else if (confirmAction === 'confirm_received') {
      runRenterAction({ action: 'confirm_received' })
    } else if (confirmAction === 'confirm_return') {
      runOwnerAction({ action: 'confirm_return' })
    }
    setConfirmAction(null)
  }

  function submitShipment() {
    if (!providerName.trim() || !trackingNumber.trim() || !shippingEvidence) {
      showToast(labels.completeRequiredFields)
      return
    }
    setShipOpen(false)
    actionMutation.mutate(() =>
      runWithEvidence(
        booking.id,
        'delivery',
        shippingEvidence,
        (evidence) => bookingService.ownerAction(booking.id, {
          action: 'mark_shipped',
          shippingMethod,
          providerName: providerName.trim(),
          trackingNumber: trackingNumber.trim(),
          note: shippingNote.trim() || undefined,
          evidenceUrl: evidence.url,
          evidencePublicId: evidence.publicId,
        }),
      ),
    )
  }

  function submitReturn() {
    if (
      !returnEvidence ||
      (returnMethod !== 'pickup' &&
        (!returnProvider.trim() || !returnTracking.trim()))
    ) {
      showToast(labels.completeRequiredFields)
      return
    }
    setReturnOpen(false)
    actionMutation.mutate(() =>
      runWithEvidence(
        booking.id,
        'return',
        returnEvidence,
        (evidence) => bookingService.renterAction(booking.id, {
          action: 'request_return',
          returnMethod,
          providerName: returnProvider.trim() || undefined,
          trackingNumber: returnTracking.trim() || undefined,
          note: returnNote.trim() || undefined,
          evidenceUrl: evidence.url,
          evidencePublicId: evidence.publicId,
        }),
      ),
    )
  }

  function submitDamage() {
    const amount = Number(damageAmount || 0)
    if (
      !damageDescription.trim() ||
      !damageEvidence ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > booking.deposit
    ) {
      showToast(labels.completeRequiredFields)
      return
    }
    setDamageOpen(false)
    actionMutation.mutate(() =>
      runWithEvidence(
        booking.id,
        'damage',
        damageEvidence,
        (evidence) => bookingService.ownerAction(booking.id, {
          action: 'report_damage',
          description: damageDescription.trim(),
          damageAmount: amount,
          evidenceUrl: evidence.url,
          evidencePublicId: evidence.publicId,
        }),
      ),
    )
  }

  const confirmCopy = confirmationCopy(confirmAction, labels)

  return (
    <section className="border-t border-gf-line bg-gf-pink-100 p-5 sm:p-7">
      <h2 className="mb-4 mt-0 text-[16px] font-bold text-gf-brown-900">
        {labels.actionTitle}
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {canStartPreparing && (
          <ActionButton
            disabled={actionMutation.isPending}
            onClick={() => setConfirmAction('start_preparing')}
          >
            {labels.startPreparing}
          </ActionButton>
        )}
        {canPrepareHandover && booking.deliveryMethod === 'pickup' && (
          <ActionButton
            disabled={actionMutation.isPending}
            onClick={() => setConfirmAction('ready_for_pickup')}
          >
            {labels.readyForPickupAction}
          </ActionButton>
        )}
        {canPrepareHandover && booking.deliveryMethod !== 'pickup' && (
          <ActionButton
            disabled={actionMutation.isPending}
            onClick={() => setShipOpen(true)}
          >
            {labels.shipItem}
          </ActionButton>
        )}
        {canConfirmReceived && (
          <ActionButton
            disabled={actionMutation.isPending}
            onClick={() => setConfirmAction('confirm_received')}
          >
            {labels.confirmReceived}
          </ActionButton>
        )}
        {canRequestReturn && (
          <ActionButton
            disabled={actionMutation.isPending}
            onClick={() => setReturnOpen(true)}
          >
            {labels.requestReturn}
          </ActionButton>
        )}
        {canReviewReturn && (
          <>
            <ActionButton
              disabled={actionMutation.isPending}
              onClick={() => setConfirmAction('confirm_return')}
            >
              {labels.confirmReturn}
            </ActionButton>
            <button
              type="button"
              disabled={actionMutation.isPending}
              onClick={() => setDamageOpen(true)}
              className="cursor-pointer rounded-full border-0 bg-gf-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {labels.reportDamage}
            </button>
          </>
        )}
      </div>
      {actionMutation.isPending && (
        <p className="mb-0 mt-3 text-xs text-gf-muted">
          {labels.processingAction}
        </p>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        title={confirmCopy.title}
        description={confirmCopy.description}
        onConfirm={confirmSelectedAction}
      />

      <FormDialog
        open={shipOpen}
        onOpenChange={setShipOpen}
        title={labels.shipItem}
        submitLabel={labels.markShipped}
        onSubmit={submitShipment}
      >
        <div className="grid gap-4">
          <Field label={labels.shippingMethodLabel}>
            <Select
              value={shippingMethod}
              onValueChange={(value) => {
                if (value === 'messenger' || value === 'shipping') {
                  setShippingMethod(value)
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="messenger">
                  {labels.deliveryMethods.messenger}
                </SelectItem>
                <SelectItem value="shipping">
                  {labels.deliveryMethods.shipping}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={labels.shippingProvider}>
            <Input
              value={providerName}
              onChange={(event) => setProviderName(event.target.value)}
              placeholder={labels.shippingProviderPlaceholder}
            />
          </Field>
          <Field label={labels.shippingTracking}>
            <Input
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder={labels.shippingTrackingPlaceholder}
            />
          </Field>
          <Field label={labels.shippingNote}>
            <Textarea
              value={shippingNote}
              onChange={(event) => setShippingNote(event.target.value)}
              placeholder={labels.shippingNotePlaceholder}
            />
          </Field>
          <Field label={labels.deliveryEvidence} hint={labels.chooseEvidence}>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setShippingEvidence(event.target.files?.[0] ?? null)
              }
            />
          </Field>
        </div>
      </FormDialog>

      <FormDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        title={labels.requestReturnTitle}
        submitLabel={labels.submitReturn}
        onSubmit={submitReturn}
      >
        <div className="grid gap-4">
          <Field label={labels.returnMethodLabel}>
            <Select
              value={returnMethod}
              onValueChange={(value) => {
                if (value) {
                  setReturnMethod(value)
                  if (value === 'pickup') {
                    setReturnProvider('')
                    setReturnTracking('')
                  }
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">{labels.deliveryMethods.pickup}</SelectItem>
                <SelectItem value="messenger">{labels.deliveryMethods.messenger}</SelectItem>
                <SelectItem value="shipping">{labels.deliveryMethods.shipping}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {returnMethod !== 'pickup' && (
            <>
              <Field label={labels.returnProvider}>
                <Input
                  value={returnProvider}
                  onChange={(event) => setReturnProvider(event.target.value)}
                  placeholder={labels.returnProviderPlaceholder}
                />
              </Field>
              <Field label={labels.returnTrackingLabel}>
                <Input
                  value={returnTracking}
                  onChange={(event) => setReturnTracking(event.target.value)}
                  placeholder={labels.returnTrackingPlaceholder}
                />
              </Field>
            </>
          )}
          <Field label={labels.returnNote}>
            <Textarea
              value={returnNote}
              onChange={(event) => setReturnNote(event.target.value)}
              placeholder={labels.returnNotePlaceholder}
            />
          </Field>
          <Field label={labels.returnEvidence} hint={labels.chooseEvidence}>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setReturnEvidence(event.target.files?.[0] ?? null)
              }
            />
          </Field>
        </div>
      </FormDialog>

      <FormDialog
        open={damageOpen}
        onOpenChange={setDamageOpen}
        title={labels.reportDamageTitle}
        submitLabel={labels.submitDamage}
        onSubmit={submitDamage}
      >
        <div className="grid gap-4">
          <Field label={labels.damageDescriptionLabel}>
            <Textarea
              value={damageDescription}
              onChange={(event) => setDamageDescription(event.target.value)}
              placeholder={labels.damageDescriptionPlaceholder}
            />
          </Field>
          <Field label={labels.damageAmountLabel}>
            <Input
              type="number"
              min={0}
              max={booking.deposit}
              step="0.01"
              value={damageAmount}
              onChange={(event) => setDamageAmount(event.target.value)}
            />
          </Field>
          <Field label={labels.damageEvidence} hint={labels.chooseEvidence}>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setDamageEvidence(event.target.files?.[0] ?? null)
              }
            />
          </Field>
        </div>
      </FormDialog>
    </section>
  )
}

async function runWithEvidence(
  bookingId: number,
  kind: BookingEvidenceKind,
  file: File,
  action: (
    evidence: { url: string; publicId: string },
  ) => Promise<ApiResponse<RenterBooking>>,
) {
  const evidence = unwrapApiResponse(
    await bookingService.uploadEvidence(bookingId, kind, file),
  )
  try {
    return unwrapApiResponse(await action(evidence))
  } catch (error) {
    await bookingService.cleanUpEvidence(bookingId, kind, evidence.publicId)
    throw error
  }
}

function confirmationCopy(
  action: ConfirmAction | null,
  labels: RentalLabels,
) {
  if (action === 'start_preparing') {
    return {
      title: labels.startPreparingTitle,
      description: labels.startPreparingDescription,
    }
  }
  if (action === 'ready_for_pickup') {
    return {
      title: labels.readyForPickupTitle,
      description: labels.readyForPickupDescription,
    }
  }
  if (action === 'confirm_received') {
    return {
      title: labels.confirmReceivedTitle,
      description: labels.confirmReceivedDescription,
    }
  }
  return {
    title: labels.confirmReturnTitle,
    description: labels.confirmReturnDescription,
  }
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer rounded-full border-0 bg-gf-pink-500 px-5 py-2.5 text-sm font-semibold text-gf-brown-900 disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mb-0 mt-1 text-xs text-gf-muted">{hint}</p>}
    </div>
  )
}

function EvidenceImage({ url, alt }: { url: string; alt: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 block w-full cursor-zoom-in overflow-hidden rounded-[8px] border border-gf-line bg-gf-pink-100 p-0"
      >
        <Image
          src={url}
          alt={alt}
          width={900}
          height={600}
          className="max-h-80 w-full object-contain"
        />
      </button>
      <ProductMediaLightbox
        media={[{ id: url, mediaType: 'image', url }]}
        productName={alt}
        initialIndex={open ? 0 : null}
        onIndexChange={(index) => setOpen(index !== null)}
        onOpenChange={setOpen}
      />
    </>
  )
}

function BookingTimeline({
  booking,
  labels,
}: {
  booking: RenterBooking
  labels: ReturnType<typeof getPageText<'myRentals'>>
}) {
  const steps = [
    labels.timeline.requested,
    labels.timeline.paymentApproved,
    labels.timeline.preparing,
    labels.timeline.handover,
    labels.timeline.renting,
    labels.timeline.returning,
    labels.timeline.completed,
  ]
  const current = statusProgress(booking.status)

  return (
    <div className="grid grid-cols-7 gap-2 max-[760px]:grid-cols-1 max-[760px]:gap-0">
      {steps.map((label, index) => {
        const complete = index <= current
        return (
          <div key={label} className="relative text-center max-[760px]:flex max-[760px]:items-center max-[760px]:gap-3 max-[760px]:pb-4 max-[760px]:text-left">
            {index < steps.length - 1 && (
              <div className={cn(
                'absolute left-[calc(50%+14px)] right-[calc(-50%+14px)] top-3 h-0.5 max-[760px]:bottom-0 max-[760px]:left-3 max-[760px]:right-auto max-[760px]:top-6 max-[760px]:h-auto max-[760px]:w-0.5',
                index < current ? 'bg-gf-green' : 'bg-gf-line',
              )} />
            )}
            <div className={cn(
              'relative z-10 mx-auto flex size-6 items-center justify-center rounded-full max-[760px]:mx-0 max-[760px]:shrink-0',
              complete ? 'bg-gf-green text-white' : 'bg-gf-pink-100 text-gf-brown-300',
            )}>
              {complete ? <Check size={14} /> : <Circle size={10} />}
            </div>
            <div className={cn(
              'mt-2 text-[11.5px] leading-snug max-[760px]:mt-0',
              complete ? 'font-semibold text-gf-brown-900' : 'text-gf-muted',
            )}>
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ExceptionNotice({
  booking,
  labels,
}: {
  booking: RenterBooking
  labels: ReturnType<typeof getPageText<'myRentals'>>
}) {
  const messages: Partial<Record<RenterBookingStatus, string>> = {
    paymentRejected: booking.payment?.rejectionReason
      ? `${labels.paymentRejected}: ${booking.payment.rejectionReason}`
      : labels.paymentRejected,
    cancelled: labels.bookingCancelled,
    expired: labels.bookingExpired,
    deliveryIssue: labels.deliveryIssue,
    disputed: labels.disputed,
  }
  const message = messages[booking.status]
  if (!message) return null

  return (
    <div className="mt-5 rounded-[8px] bg-[#FAE0DA] p-4 text-[13px] leading-relaxed text-gf-red">
      {message}
    </div>
  )
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="p-5 sm:p-7">
      <h2 className="mb-4 mt-0 flex items-center gap-2 text-[16px] font-bold text-gf-brown-900">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  )
}

function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-gf-line py-2.5 text-[13px] last:border-b-0">
      <span className="text-gf-muted">{label}</span>
      <span className={cn(
        'text-right text-gf-brown-900',
        strong && 'font-bold',
      )}>
        {value}
      </span>
    </div>
  )
}

function statusProgress(status: RenterBookingStatus) {
  const progress: Record<RenterBookingStatus, number> = {
    pendingPayment: 0,
    pendingPaymentReview: 0,
    paymentRejected: 0,
    paymentApproved: 1,
    preparing: 2,
    readyForPickup: 3,
    shipped: 3,
    active: 4,
    returnPending: 5,
    completed: 6,
    cancelled: 0,
    expired: 0,
    deliveryIssue: 3,
    disputed: 5,
  }
  return progress[status]
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}
