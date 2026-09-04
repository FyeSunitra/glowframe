import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { prisma } from '@/lib/prisma'
import { serializeTemplate } from '../route'

const textFields = ['nameTh', 'nameEn', 'subjectTh', 'subjectEn', 'bodyTh', 'bodyEn'] as const
const recipientRoles = ['renter', 'owner', 'admin'] as const

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    const { id } = await context.params
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid email template id.' }, { status: 400 })
    const body = await request.json()
    if (textFields.some((field) => typeof body?.[field] !== 'string' || !body[field].trim())) {
      return NextResponse.json({ error: 'Thai and English names, subjects, and content are required.' }, { status: 400 })
    }
    if (typeof body.isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Template enabled status is required.' }, { status: 400 })
    }
    const rawRecipientRoles: unknown[] = Array.isArray(body.recipientRoles)
      ? body.recipientRoles
      : []
    const selectedRecipientRoles = rawRecipientRoles.filter(
      (role): role is (typeof recipientRoles)[number] =>
        typeof role === 'string' && recipientRoles.includes(role as (typeof recipientRoles)[number]),
    )
    if (selectedRecipientRoles.length === 0 || selectedRecipientRoles.length !== body.recipientRoles?.length) {
      return NextResponse.json({ error: 'Select at least one valid notification recipient.' }, { status: 400 })
    }

    const template = await prisma.emailTemplate.update({
      where: { id: BigInt(id) },
      data: {
        nameTh: body.nameTh.trim(), nameEn: body.nameEn.trim(),
        subjectTh: body.subjectTh.trim(), subjectEn: body.subjectEn.trim(),
        bodyTh: body.bodyTh.trim(), bodyEn: body.bodyEn.trim(),
        recipientRoles: [...new Set(selectedRecipientRoles)],
        isEnabled: body.isEnabled, updatedBy: admin.user.id,
      },
      include: { updater: { select: { displayName: true } } },
    })
    return NextResponse.json({ data: serializeTemplate(template) })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Email template not found.' }, { status: 404 })
    }
    console.error('Failed to update email template', error)
    return NextResponse.json({ error: 'Unable to update email template.' }, { status: 500 })
  }
}
