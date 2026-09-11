import 'server-only'

import { prisma } from '@/lib/prisma'
import {
  createTemplatedNotification,
  deliverNotificationAfterCommit,
} from '@/lib/notifications/notificationService'

type AdminReviewRequestKind =
  | 'identity_verification'
  | 'bank_account'
  | 'product_listing'
  | 'withdrawal'

interface AdminReviewRequestInput {
  kind: AdminReviewRequestKind
  recordId: bigint
  requesterName?: string | null
  reference: string
  amount?: string | null
  linkUrl: string
  dedupeSuffix?: string
}

const REQUEST_LABELS: Record<AdminReviewRequestKind, { th: string; en: string }> = {
  identity_verification: { th: 'คำขอยืนยันตัวตน', en: 'identity verification request' },
  bank_account: { th: 'คำขอเพิ่มบัญชีธนาคาร', en: 'bank account verification request' },
  product_listing: { th: 'คำขอลงสินค้า', en: 'product listing request' },
  withdrawal: { th: 'คำขอถอนเงิน', en: 'withdrawal request' },
}

function reviewLink(input: AdminReviewRequestInput) {
  if (input.kind === 'identity_verification') {
    return `${input.linkUrl}?verification=${input.recordId}`
  }
  return input.linkUrl
}

/** Queues a review-required notification for every active administrator. */
export async function notifyAdminsOfReviewRequest(input: AdminReviewRequestInput) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin', status: 'active' },
      select: { id: true, displayName: true },
    })
    const label = REQUEST_LABELS[input.kind]
    const requesterName = input.requesterName?.trim() || 'ผู้ใช้ GlowFrame'

    for (const admin of admins) {
      const queued = await createTemplatedNotification(prisma, {
        userId: admin.id,
        type: 'admin_review_required',
        recipientRole: 'admin',
        variables: {
          user_name: admin.displayName,
          request_type: label.th,
          requester_name: requesterName,
          request_reference: input.reference,
          request_amount: input.amount ?? '-',
        },
        fallbackTitle: `มี${label.th}รอตรวจสอบ`,
        fallbackBody: `${requesterName} ส่ง${label.th}: ${input.reference}`,
        linkUrl: reviewLink(input),
        entityType: input.kind,
        entityId: input.recordId,
        dedupeKey: `admin-review:${input.kind}:${input.recordId}:${input.dedupeSuffix ?? 'initial'}:${admin.id}`,
      })
      await deliverNotificationAfterCommit(queued.notification, queued.created)
    }
  } catch (error) {
    console.error('Failed to queue admin review request notification', {
      kind: input.kind,
      recordId: input.recordId.toString(),
      error,
    })
  }
}
