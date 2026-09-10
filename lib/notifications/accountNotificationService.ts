import 'server-only'

import { prisma } from '@/lib/prisma'
import { createTemplatedNotification, deliverNotificationAfterCommit } from '@/lib/notifications/notificationService'

type ReviewStatus = 'approved' | 'rejected'
type AccountReviewKind = 'bank_account' | 'identity_verification'

interface AccountReviewNotificationInput {
  kind: AccountReviewKind
  recordId: bigint
  userId: bigint
  status: ReviewStatus
  displayName?: string | null
  detail?: string | null
}

/** Queues a review result without allowing email delivery to break the admin action. */
export async function notifyAccountReview(input: AccountReviewNotificationInput) {
  const approved = input.status === 'approved'
  const verificationType = input.kind === 'bank_account' ? 'บัญชีธนาคาร' : 'การยืนยันตัวตน'
  const statusLabel = approved ? 'อนุมัติแล้ว' : 'ไม่ผ่านการตรวจสอบ'
  const subject = `${verificationType}${approved ? 'ได้รับการอนุมัติ' : 'ไม่ผ่านการตรวจสอบ'}`
  const detail = input.detail?.trim()
  const body = input.kind === 'bank_account'
    ? approved
      ? 'บัญชีธนาคารของคุณได้รับการอนุมัติแล้ว สามารถใช้บัญชีนี้สำหรับการถอนเงินได้'
      : `บัญชีธนาคารของคุณไม่ผ่านการตรวจสอบ${detail ? ` เหตุผล: ${detail}` : ''} กรุณาตรวจสอบข้อมูลและส่งคำขอใหม่`
    : approved
      ? 'การยืนยันตัวตนของคุณได้รับการอนุมัติแล้ว คุณสามารถใช้งานฟีเจอร์ที่ต้องผ่านการยืนยันตัวตนได้'
      : `เอกสารยืนยันตัวตนของคุณไม่ผ่านการตรวจสอบ${detail ? ` เหตุผล: ${detail}` : ''} กรุณาตรวจสอบและส่งเอกสารใหม่`
  try {
    const queued = await createTemplatedNotification(prisma, {
      userId: input.userId,
      type: 'account_security_update',
      variables: {
        user_name: input.displayName?.trim() ?? 'ผู้ใช้ GlowFrame',
        verification_type: verificationType,
        verification_status: statusLabel,
        rejection_reason: detail ?? '-',
      },
      fallbackTitle: subject,
      fallbackBody: body,
      linkUrl: input.kind === 'bank_account' ? '/account/wallet' : '/account/profile',
      entityType: input.kind,
      entityId: input.recordId,
      dedupeKey: `${input.kind}:${input.recordId}:review:${input.status}`,
    })
    await deliverNotificationAfterCommit(queued.notification, queued.created)
  } catch (error) {
    console.error('Failed to queue account review notification', {
      kind: input.kind,
      recordId: input.recordId.toString(),
      status: input.status,
      error,
    })
  }
}
