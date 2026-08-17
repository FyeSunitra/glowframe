import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'

function encryptionKey() {
  const secret = process.env.BANK_ACCOUNT_ENCRYPTION_KEY?.trim()
  if (!secret) {
    throw new Error('BANK_ACCOUNT_ENCRYPTION_KEY is not configured.')
  }
  return createHash('sha256').update(secret).digest()
}

export function encryptBankAccountNumber(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptBankAccountNumber(value: string) {
  const [version, iv, tag, encrypted] = value.split(':')
  if (version !== 'v1' || !iv || !tag || !encrypted) {
    throw new Error('Encrypted bank account format is invalid.')
  }
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
