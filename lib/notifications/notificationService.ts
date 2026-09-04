import 'server-only'

import { Prisma } from '@/lib/generated/prisma/client'
import {
  createGlowframeEmailHtml,
  htmlToPlainText,
  renderEmailHtmlTemplate,
  renderEmailTemplate,
} from '@/lib/email/emailTemplateUtils'
import { sendTransactionalEmail } from '@/lib/email/gmailSmtp'
import { prisma } from '@/lib/prisma'
import {
  RENTAL_NOTIFICATION_MAP,
  type RentalNotificationContext,
  type RentalNotificationEvent,
} from '@/lib/notifications/rentalNotificationMap'

const EMAIL_STATUS = {
  pending: 'pending',
  sending: 'sending',
  sent: 'sent',
  failed: 'failed',
  skipped: 'skipped',
} as const

type NotificationClient = Prisma.TransactionClient | typeof prisma

export interface CreateNotificationInput {
  userId: bigint
  type: string
  title: string
  body?: string | null
  emailHtml?: string | null
  linkUrl?: string | null
  entityType?: string | null
  entityId?: bigint | null
  dedupeKey: string
  emailStatus?: (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS]
}

export interface CreateTemplatedNotificationInput {
  userId: bigint
  type: string
  dedupeKey: string
  variables: Record<string, string>
  fallbackTitle: string
  fallbackBody: string
  linkUrl?: string | null
  entityType?: string | null
  entityId?: bigint | null
  recipientRole?: 'renter' | 'owner' | 'admin'
}

/**
 * Creates the in-app item and its email delivery record. Call this within the
 * same database transaction as the business status change, then deliver it
 * only after that transaction has committed.
 */
export async function createNotification(
  client: NotificationClient,
  input: CreateNotificationInput,
) {
  const existing = await client.notification.findUnique({
    where: { dedupeKey: input.dedupeKey },
  })
  if (existing) return { notification: existing, created: false }

  try {
    const notification = await client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        emailHtml: input.emailHtml,
        linkUrl: input.linkUrl,
        entityType: input.entityType,
        entityId: input.entityId,
        dedupeKey: input.dedupeKey,
        emailStatus: input.emailStatus ?? EMAIL_STATUS.pending,
      },
    })
    return { notification, created: true }
  } catch (error) {
    // A concurrent request can create the same dedupe key after findUnique.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const notification = await client.notification.findUniqueOrThrow({
        where: { dedupeKey: input.dedupeKey },
      })
      return { notification, created: false }
    }
    throw error
  }
}

export async function createTemplatedNotification(
  client: NotificationClient,
  input: CreateTemplatedNotificationInput,
) {
  const template = await client.emailTemplate.findUnique({ where: { key: input.type } })
  if (template && input.recipientRole && !template.recipientRoles.includes(input.recipientRole)) {
    return { notification: null, created: false }
  }
  const title = template
    ? renderEmailTemplate(template.subjectTh, input.variables)
    : input.fallbackTitle
  const actionUrl = toAbsoluteUrl(input.linkUrl)
  const variables = { ...input.variables, action_url: actionUrl ?? '' }
  const bodyHtml = template
    ? renderEmailHtmlTemplate(template.bodyTh, variables)
    : `<p>${escapeHtml(input.fallbackBody)}</p>`
  const emailHtml = createGlowframeEmailHtml({ title, bodyHtml, actionUrl })

  return createNotification(client, {
    userId: input.userId,
    type: input.type,
    title,
    body: htmlToPlainText(bodyHtml),
    emailHtml,
    linkUrl: input.linkUrl,
    entityType: input.entityType,
    entityId: input.entityId,
    dedupeKey: input.dedupeKey,
    emailStatus: template?.isEnabled === false ? EMAIL_STATUS.skipped : EMAIL_STATUS.pending,
  })
}

/**
 * Queues the rental-flow notification from one central event definition.
 * Recipient selection and message content live in the business mapping, while
 * the database template only controls the shared template switch.
 */
export async function createRentalFlowNotifications(
  client: NotificationClient,
  event: RentalNotificationEvent,
  context: RentalNotificationContext,
) {
  const definition = RENTAL_NOTIFICATION_MAP[event]
  const recipientIds = new Map<string, bigint>()
  const directRecipients = new Map([
    ['renter', context.renterId],
    ['owner', context.ownerId],
  ])

  for (const recipient of definition.recipients) {
    if (recipient === 'admin') {
      const admins = await client.user.findMany({
        where: { role: 'admin', status: 'active' },
        select: { id: true },
      })
      admins.forEach((admin) => recipientIds.set(`admin:${admin.id}`, admin.id))
    } else {
      const userId = directRecipients.get(recipient)
      if (userId) recipientIds.set(`${recipient}:${userId}`, userId)
    }
  }

  const message = definition.message(escapeRentalContext(context))
  const template = await client.emailTemplate.findUnique({
    where: { key: definition.templateKey },
    select: { isEnabled: true },
  })
  const notifications = []
  for (const [recipientKey, userId] of recipientIds) {
    const isAdmin = recipientKey.startsWith('admin:')
    const title = message.titleTh
    const emailHtml = createGlowframeEmailHtml({
      title,
      bodyHtml: message.bodyTh,
      actionUrl: toAbsoluteUrl(context.bookingId ? `/rentals/${context.bookingId}` : null),
    })
    notifications.push(
      await createNotification(client, {
        userId,
        type: definition.templateKey,
        title,
        body: htmlToPlainText(message.bodyTh),
        emailHtml,
        linkUrl: isAdmin
          ? `/admin/bookings?booking=${context.bookingId}`
          : `/rentals/${context.bookingId}`,
        entityType: 'booking',
        entityId: context.bookingId,
        dedupeKey: `rental:${context.bookingId}:${event}:${recipientKey}`,
        emailStatus: template?.isEnabled === false ? EMAIL_STATUS.skipped : EMAIL_STATUS.pending,
      }),
    )
  }
  return notifications
}

function escapeRentalContext(context: RentalNotificationContext): RentalNotificationContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      typeof value === 'string' ? escapeHtml(value) : value,
    ]),
  ) as RentalNotificationContext
}

/**
 * Best-effort delivery for use after a business transaction commits. Errors
 * are recorded on the notification and never change the already-saved status.
 */
export async function deliverNotificationAfterCommit(notification: { id: bigint } | null, created: boolean) {
  if (!created || !notification) return
  try {
    await deliverPendingNotificationEmail(notification.id)
  } catch (error) {
    console.error('Unexpected notification delivery failure', {
      notificationId: notification.id.toString(),
      error,
    })
  }
}

/**
 * Delivers a queued email without affecting the business transaction that
 * created it. A conditional update claims the item and prevents double sends.
 */
export async function deliverPendingNotificationEmail(notificationId: bigint) {
  const claimed = await prisma.notification.updateMany({
    where: { id: notificationId, emailStatus: EMAIL_STATUS.pending },
    data: {
      emailStatus: EMAIL_STATUS.sending,
      emailAttempts: { increment: 1 },
      emailLastAttemptAt: new Date(),
      emailError: null,
    },
  })
  if (claimed.count !== 1) return { delivered: false, reason: 'not_pending' as const }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: { user: { select: { email: true } } },
  })
  if (!notification?.user.email) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { emailStatus: EMAIL_STATUS.skipped, emailError: 'Recipient email is unavailable.' },
    })
    return { delivered: false, reason: 'no_recipient' as const }
  }

  try {
    const result = await sendTransactionalEmail({
      to: notification.user.email,
      subject: notification.title,
      text: notification.body || notification.title,
      html: notification.emailHtml ?? (notification.body ? toEmailHtml(notification.title, notification.body) : undefined),
    })
    if (!result.accepted.includes(notification.user.email)) {
      throw new Error('SMTP did not accept the recipient.')
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        emailStatus: EMAIL_STATUS.sent,
        emailSentAt: new Date(),
        emailProviderMessageId: result.messageId,
        emailError: null,
      },
    })
    return { delivered: true, messageId: result.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP error.'
    console.error('Failed to deliver notification email', { notificationId: notificationId.toString(), error })
    await prisma.notification.update({
      where: { id: notificationId },
      data: { emailStatus: EMAIL_STATUS.failed, emailError: message.slice(0, 4000) },
    })
    return { delivered: false, reason: 'delivery_failed' as const }
  }
}

export { EMAIL_STATUS }

function toEmailHtml(title: string, body: string) {
  return `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(body).replace(/\n/g, '<br />')}</p>`
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }
    return entities[character]
  })
}

function toAbsoluteUrl(linkUrl: string | null | undefined) {
  if (!linkUrl) return null
  if (/^https?:\/\//i.test(linkUrl)) return linkUrl
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  if (!baseUrl) return null
  try {
    return new URL(linkUrl, baseUrl).toString()
  } catch {
    return null
  }
}
