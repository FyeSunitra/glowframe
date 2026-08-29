import type { Prisma } from '@/lib/generated/prisma/client'
import type { PhotoboothFrameInput, PhotoboothFrameSlot } from '@/types/photobooth'

interface FrameRecord {
  id: bigint
  nameTh: string
  nameEn: string
  descriptionTh: string | null
  descriptionEn: string | null
  canvasWidth: number
  canvasHeight: number
  aspectRatioLabel: string | null
  frameCount: number
  slotConfig: Prisma.JsonValue
  overlayUrl: string
  overlayPublicId: string
  originalFileName: string | null
  price?: Prisma.Decimal | number | string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export function serializePhotoboothFrame(frame: FrameRecord) {
  return {
    id: Number(frame.id),
    nameTh: frame.nameTh,
    nameEn: frame.nameEn,
    descriptionTh: frame.descriptionTh ?? undefined,
    descriptionEn: frame.descriptionEn ?? undefined,
    canvasWidth: frame.canvasWidth,
    canvasHeight: frame.canvasHeight,
    aspectRatioLabel: frame.aspectRatioLabel ?? undefined,
    frameCount: frame.frameCount,
    slots: parseSlots(frame.slotConfig),
    overlayUrl: frame.overlayUrl,
    overlayPublicId: frame.overlayPublicId,
    originalFileName: frame.originalFileName ?? undefined,
    price: frame.price == null ? undefined : Number(frame.price),
    active: frame.isActive,
    sortOrder: frame.sortOrder,
    createdAt: frame.createdAt.toISOString(),
    updatedAt: frame.updatedAt.toISOString(),
  }
}

export function validatePhotoboothFrameInput(value: unknown) {
  if (!value || typeof value !== 'object') return invalid('Frame data is invalid.')
  const body = value as Partial<PhotoboothFrameInput>
  const nameTh = text(body.nameTh, 160)
  const nameEn = text(body.nameEn, 160)
  const canvasWidth = integer(body.canvasWidth)
  const canvasHeight = integer(body.canvasHeight)
  const slots = parseSlots(body.slots)
  const overlayUrl = text(body.overlayUrl, 2000)
  const overlayPublicId = text(body.overlayPublicId, 500)
  const price = optionalPrice(body.price)

  if (!nameTh || !nameEn) return invalid('Thai and English frame names are required.')
  if (!canvasWidth || !canvasHeight || canvasWidth > 8000 || canvasHeight > 8000) {
    return invalid('Frame dimensions are invalid.')
  }
  if (!slots.length || slots.length > 12) return invalid('The frame must contain 1 to 12 photo areas.')
  if (price === 'invalid') return invalid('The frame price must be between 0 and 99,999,999.99.')
  if (!validCloudinaryUrl(overlayUrl) || !overlayPublicId.startsWith('glowframe/photobooth/frames/')) {
    return invalid('The frame overlay is invalid.')
  }

  return {
    success: true as const,
    data: {
      nameTh,
      nameEn,
      descriptionTh: optionalText(body.descriptionTh),
      descriptionEn: optionalText(body.descriptionEn),
      canvasWidth,
      canvasHeight,
      aspectRatioLabel: optionalText(body.aspectRatioLabel, 20),
      frameCount: slots.length,
      slotConfig: slots as unknown as Prisma.InputJsonValue,
      overlayUrl,
      overlayPublicId,
      originalFileName: optionalText(body.originalFileName, 255),
      price,
      isActive: typeof body.active === 'boolean' ? body.active : true,
      sortOrder: Number.isInteger(body.sortOrder) ? Number(body.sortOrder) : 0,
    },
  }
}

export function parseSlots(value: unknown): PhotoboothFrameSlot[] {
  if (!Array.isArray(value)) return []
  const slots: PhotoboothFrameSlot[] = []
  for (const [position, item] of value.entries()) {
    if (!item || typeof item !== 'object') return []
    const candidate = item as Partial<PhotoboothFrameSlot>
    const x = finite(candidate.x)
    const y = finite(candidate.y)
    const width = finite(candidate.width)
    const height = finite(candidate.height)
    if (
      x === null || y === null || width === null || height === null ||
      x < 0 || y < 0 || width <= 0 || height <= 0 ||
      x + width > 1.001 || y + height > 1.001
    ) return []
    slots.push({ index: position, x, y, width, height })
  }
  return slots
}

function validCloudinaryUrl(value: string) {
  try {
    return new URL(value).hostname === 'res.cloudinary.com'
  } catch {
    return false
  }
}

function text(value: unknown, max = 10000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function optionalText(value: unknown, max = 10000) {
  return text(value, max) || null
}

function integer(value: unknown) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function finite(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function optionalPrice(value: unknown): number | null | 'invalid' {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0 || number > 99999999.99) return 'invalid'
  return Math.round(number * 100) / 100
}

function invalid(error: string) {
  return { success: false as const, error }
}
