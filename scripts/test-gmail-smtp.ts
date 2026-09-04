import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function main() {
  const { sendTransactionalEmail, verifyGmailSmtpConnection } = await import(
    '../lib/email/gmailSmtpCore'
  )
  const recipient = process.env.SMTP_TEST_TO?.trim() || process.env.SMTP_USER?.trim()

  if (!recipient) {
    throw new Error('Set SMTP_TEST_TO or SMTP_USER before sending a test email.')
  }

  await verifyGmailSmtpConnection()
  const result = await sendTransactionalEmail({
    to: recipient,
    subject: 'GlowFrame SMTP test',
    text: 'Gmail SMTP is connected to GlowFrame successfully.',
    html: '<p>Gmail SMTP is connected to <strong>GlowFrame</strong> successfully.</p>',
  })

  console.log(`SMTP test email accepted for: ${result.accepted.join(', ')}`)
  console.log(`Message ID: ${result.messageId}`)

  if (result.rejected.length > 0) {
    throw new Error(`SMTP rejected: ${result.rejected.join(', ')}`)
  }
}

main().catch((error: unknown) => {
  console.error('SMTP test failed:', error)
  process.exitCode = 1
})
