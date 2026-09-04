import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import {
  createGlowframeEmailHtml,
  EMAIL_TEMPLATE_SAMPLE_VARIABLES,
  htmlToPlainText,
  renderEmailHtmlTemplate,
  renderEmailTemplate,
} from '@/lib/email/emailTemplateUtils'
import { sendTransactionalEmail } from '@/lib/email/gmailSmtp'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    const { id } = await context.params
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid email template id.' }, { status: 400 })
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const locale = body?.locale === 'en' ? 'en' : 'th'
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'A valid test email is required.' }, { status: 400 })
    }

    const template = await prisma.emailTemplate.findUnique({ where: { id: BigInt(id) } })
    if (!template) return NextResponse.json({ error: 'Email template not found.' }, { status: 404 })
    const subject = renderEmailTemplate(locale === 'th' ? template.subjectTh : template.subjectEn, EMAIL_TEMPLATE_SAMPLE_VARIABLES)
    const bodyHtml = renderEmailHtmlTemplate(
      locale === 'th' ? template.bodyTh : template.bodyEn,
      EMAIL_TEMPLATE_SAMPLE_VARIABLES,
    )
    const html = createGlowframeEmailHtml({
      title: subject,
      bodyHtml,
      actionUrl: EMAIL_TEMPLATE_SAMPLE_VARIABLES.action_url,
    })
    const result = await sendTransactionalEmail({
      to: email,
      subject: `[TEST] ${subject}`,
      text: htmlToPlainText(bodyHtml),
      html,
    })
    if (!result.accepted.includes(email)) {
      return NextResponse.json({ error: 'SMTP did not accept the test recipient.' }, { status: 502 })
    }
    return NextResponse.json({ data: { messageId: result.messageId } })
  } catch (error) {
    console.error('Failed to send test email template', error)
    return NextResponse.json({ error: 'Unable to send the test email.' }, { status: 502 })
  }
}
