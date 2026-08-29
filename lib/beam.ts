import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

interface BeamQrChargeInput {
  amountSatang: number
  expiryTime: string
  referenceId: string
  returnUrl: string
}

interface BeamQrChargeResponse {
  actionRequired?: string
  chargeId?: string
  encodedImage?: {
    expiry?: string
    imageBase64Encoded?: string
    rawData?: string
  }
  paymentMethodType?: string
}

export interface BeamChargeStatus {
  chargeId?: string
  referenceId?: string
  merchantId?: string
  amount?: number
  currency?: string
  status?: string
  failureCode?: string
  transactionTime?: string
}

export class BeamApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'BeamApiError'
  }
}

export async function createBeamQrCharge(input: BeamQrChargeInput) {
  const response = await beamRequest<BeamQrChargeResponse>('/api/v1/charges', {
    method: 'POST',
    headers: { 'Idempotency-Key': input.referenceId },
    body: JSON.stringify({
      amount: input.amountSatang,
      currency: 'THB',
      paymentMethod: {
        qrPromptPay: { expiryTime: input.expiryTime },
        paymentMethodType: 'QR_PROMPT_PAY',
      },
      referenceId: input.referenceId,
      returnUrl: input.returnUrl,
      skip3dsFlow: false,
    }),
  })

  if (
    response.actionRequired !== 'ENCODED_IMAGE' ||
    !response.chargeId ||
    !response.encodedImage?.imageBase64Encoded
  ) {
    throw new BeamApiError('Beam did not return a valid PromptPay QR charge.')
  }

  return {
    chargeId: response.chargeId,
    expiry: response.encodedImage.expiry,
    imageBase64Encoded: response.encodedImage.imageBase64Encoded,
    rawData: response.encodedImage.rawData,
  }
}

export function getBeamCharge(chargeId: string) {
  return beamRequest<BeamChargeStatus>(`/api/v1/charges/${encodeURIComponent(chargeId)}`)
}

export function verifyBeamWebhook(rawBody: string, signature: string | null) {
  const encodedKey = process.env.BEAM_WEBHOOK_HMAC_KEY?.trim()
  if (!encodedKey) throw new Error('BEAM_WEBHOOK_HMAC_KEY is not configured.')
  if (!signature) return false

  try {
    const key = Buffer.from(encodedKey, 'base64')
    const received = Buffer.from(signature, 'base64')
    const expected = createHmac('sha256', key).update(rawBody).digest()
    return received.length === expected.length && timingSafeEqual(received, expected)
  } catch {
    return false
  }
}

export function getBeamMerchantId() {
  return requiredEnv('BEAM_MERCHANT_ID')
}

async function beamRequest<T>(path: string, init: RequestInit = {}) {
  const baseUrl = requiredEnv('BEAM_API_URL').replace(/\/+$/, '')
  if (!baseUrl.startsWith('https://')) throw new BeamApiError('BEAM_API_URL must use HTTPS.')

  const merchantId = requiredEnv('BEAM_MERCHANT_ID')
  const apiKey = requiredEnv('BEAM_API_KEY')
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${merchantId}:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new BeamApiError(`Beam request failed with status ${response.status}.`, response.status)
  }

  return (await response.json()) as T
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new BeamApiError(`${name} is not configured.`)
  return value
}
