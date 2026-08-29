import type { PhotoboothFrameSlot } from '@/types/photobooth'

const MAX_ANALYSIS_SIDE = 1000
const ALPHA_THRESHOLD = 32
const MIN_SLOT_AREA_RATIO = 0.004

export interface DetectedPhotoboothFrame {
  canvasWidth: number
  canvasHeight: number
  aspectRatioLabel: string
  slots: PhotoboothFrameSlot[]
}

export async function detectPhotoboothFrame(
  file: File,
): Promise<DetectedPhotoboothFrame> {
  if (file.type !== 'image/png') {
    throw new Error('Photobooth frames must be PNG files.')
  }

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas is unavailable.')

    context.drawImage(bitmap, 0, 0, width, height)
    const pixels = context.getImageData(0, 0, width, height).data
    const slots = detectTransparentComponents(pixels, width, height)
    if (slots.length === 0) {
      throw new Error('No transparent photo areas were detected in this PNG.')
    }

    return {
      canvasWidth: bitmap.width,
      canvasHeight: bitmap.height,
      aspectRatioLabel: getAspectRatioLabel(bitmap.width, bitmap.height),
      slots,
    }
  } finally {
    bitmap.close()
  }
}

function detectTransparentComponents(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const pixelCount = width * height
  const visited = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  const minimumArea = Math.max(64, Math.round(pixelCount * MIN_SLOT_AREA_RATIO))
  const components: Array<{
    minX: number
    minY: number
    maxX: number
    maxY: number
    area: number
  }> = []

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || pixels[start * 4 + 3] >= ALPHA_THRESHOLD) continue

    let head = 0
    let tail = 0
    let area = 0
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    let touchesEdge = false
    queue[tail++] = start
    visited[start] = 1

    while (head < tail) {
      const current = queue[head++]
      const x = current % width
      const y = Math.floor(current / width)
      area += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true

      visit(current - 1, x > 0)
      visit(current + 1, x < width - 1)
      visit(current - width, y > 0)
      visit(current + width, y < height - 1)
    }

    if (!touchesEdge && area >= minimumArea) {
      components.push({ minX, minY, maxX, maxY, area })
    }

    function visit(index: number, inBounds: boolean) {
      if (
        !inBounds ||
        visited[index] ||
        pixels[index * 4 + 3] >= ALPHA_THRESHOLD
      ) return
      visited[index] = 1
      queue[tail++] = index
    }
  }

  return components
    .sort((a, b) => {
      const rowTolerance = Math.min(a.maxY - a.minY, b.maxY - b.minY) * 0.45
      const centerAY = (a.minY + a.maxY) / 2
      const centerBY = (b.minY + b.maxY) / 2
      return Math.abs(centerAY - centerBY) <= rowTolerance
        ? a.minX - b.minX
        : centerAY - centerBY
    })
    .map((component, index) => ({
      index,
      x: round(component.minX / width),
      y: round(component.minY / height),
      width: round((component.maxX - component.minX + 1) / width),
      height: round((component.maxY - component.minY + 1) / height),
    }))
}

export function getAspectRatioLabel(width: number, height: number) {
  const ratio = width / height
  const knownRatios: Array<[string, number]> = [
    ['1:1', 1],
    ['4:3', 4 / 3],
    ['3:4', 3 / 4],
    ['16:9', 16 / 9],
    ['9:16', 9 / 16],
  ]
  const match = knownRatios.find(([, known]) => Math.abs(ratio - known) <= 0.025)
  return match?.[0] ?? 'Custom'
}

function round(value: number) {
  return Math.round(value * 100000) / 100000
}
