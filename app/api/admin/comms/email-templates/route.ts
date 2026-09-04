import { NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { EMAIL_TEMPLATE_VARIABLES } from '@/lib/email/emailTemplateUtils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

    const templates = await prisma.emailTemplate.findMany({
      where: { key: { in: ['booking_status_update', 'return_reminder'] } },
      orderBy: { key: 'asc' },
      include: { updater: { select: { displayName: true } } },
    })
    return NextResponse.json({ data: templates.map(serializeTemplate) })
  } catch (error) {
    console.error('Failed to load email templates', error)
    return NextResponse.json({ error: 'Unable to load email templates.' }, { status: 500 })
  }
}

export function serializeTemplate(template: {
  id: bigint
  key: string
  nameTh: string
  nameEn: string
  subjectTh: string
  subjectEn: string
  bodyTh: string
  bodyEn: string
  recipientRoles: string[]
  isEnabled: boolean
  updatedAt: Date
  updater?: { displayName: string } | null
}) {
  return {
    id: Number(template.id), key: template.key, nameTh: template.nameTh, nameEn: template.nameEn,
    subjectTh: template.subjectTh, subjectEn: template.subjectEn, bodyTh: template.bodyTh,
    bodyEn: template.bodyEn, recipientRoles: template.recipientRoles,
    isEnabled: template.isEnabled, updatedAt: template.updatedAt.toISOString(),
    updatedByName: template.updater?.displayName ?? null,
    availableVariables: EMAIL_TEMPLATE_VARIABLES[template.key] ?? [],
  }
}
