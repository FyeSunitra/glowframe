import nodemailer from 'nodemailer'

export interface TransactionalEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

interface GmailSmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

function getConfig(): GmailSmtpConfig {
  const port = Number(process.env.SMTP_PORT ?? '465')
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid port number.')
  }

  return {
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE.toLowerCase() === 'true'
      : port === 465,
    user: getRequiredEnv('SMTP_USER'),
    pass: getRequiredEnv('SMTP_PASS'),
    from: process.env.EMAIL_FROM?.trim() || getRequiredEnv('SMTP_USER'),
  }
}

function createTransporter(config = getConfig()) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })
}

export async function verifyGmailSmtpConnection() {
  await createTransporter().verify()
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const config = getConfig()
  const result = await createTransporter(config).sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  })

  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
    response: result.response,
  }
}
