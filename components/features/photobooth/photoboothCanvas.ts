import type { PhotoboothFrame, PhotoboothFrameStyle } from '@/types/photobooth'

const MAX_PHOTO_OUTPUT_SIDE = 4096
const MAX_GIF_OUTPUT_SIDE = 960

export function captureVideoFrame(video: HTMLVideoElement) {
  const canvas = document.createElement('canvas')
  canvas.width = 960
  canvas.height = 720
  const context = requiredContext(canvas)

  context.save()
  context.translate(canvas.width, 0)
  context.scale(-1, 1)
  drawVideoCover(context, video, canvas.width, canvas.height)
  context.restore()

  return canvas.toDataURL('image/jpeg', 0.92)
}

export async function createPhotoStrip(
  sources: string[],
  frameColor: string,
  style: PhotoboothFrameStyle,
) {
  const images = await Promise.all(sources.map(loadImage))
  const width = 720
  const sidePadding = style === 'minimal' ? 28 : style === 'film' ? 76 : 52
  const topPadding = style === 'minimal' ? 28 : 48
  const gap = style === 'minimal' ? 10 : 18
  const footer = style === 'minimal' ? 72 : 92
  const photoWidth = width - sidePadding * 2
  const photoHeight = Math.round(photoWidth * 0.75)
  const height = topPadding + images.length * photoHeight + (images.length - 1) * gap + footer
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = requiredContext(canvas)

  context.fillStyle = frameColor
  context.fillRect(0, 0, width, height)
  if (style === 'film') drawFilmRails(context, width, height)

  images.forEach((image, index) => {
    const y = topPadding + index * (photoHeight + gap)
    drawImageCover(context, image, sidePadding, y, photoWidth, photoHeight)
    if (style === 'minimal') {
      context.strokeStyle = 'rgba(76,54,48,0.18)'
      context.lineWidth = 2
      context.strokeRect(sidePadding, y, photoWidth, photoHeight)
    }
  })

  drawCaption(context, width, height, frameColor, 'GlowFrame Photobooth')
  return canvasToBlob(canvas, 'image/png')
}

export async function createAnimatedGif(
  sources: string[],
) {
  const [{ GIFEncoder, quantize, applyPalette }, images] = await Promise.all([
    import('gifenc'),
    Promise.all(sources.map(loadImage)),
  ])
  const firstImage = images[0]
  if (!firstImage) throw new Error('At least one photo is required to create a GIF.')

  const scale = Math.min(
    1,
    MAX_GIF_OUTPUT_SIDE / Math.max(firstImage.naturalWidth, firstImage.naturalHeight),
  )
  const width = Math.max(1, Math.round(firstImage.naturalWidth * scale))
  const height = Math.max(1, Math.round(firstImage.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = requiredContext(canvas, true)
  const encoder = GIFEncoder()

  const renderedFrames = images.map((image) => {
    context.clearRect(0, 0, width, height)
    drawImageCover(context, image, 0, 0, width, height)
    return new Uint8ClampedArray(context.getImageData(0, 0, width, height).data)
  })
  renderedFrames.forEach((rgba) => {
    // Each shot gets its own 256-color palette for better photo color fidelity.
    const palette = quantize(rgba, 256, { format: 'rgb565' })
    const indexed = applyPalette(rgba, palette, 'rgb565')
    encoder.writeFrame(indexed, width, height, {
      palette,
      delay: 900,
      repeat: 0,
    })
  })

  encoder.finish()
  const bytes = encoder.bytes()
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return new Blob([copy.buffer], { type: 'image/gif' })
}

export async function createFramedPhoto(
  sources: string[],
  frame: PhotoboothFrame,
) {
  const [images, overlay] = await Promise.all([
    Promise.all(sources.map(loadImage)),
    loadImage(frame.overlayUrl),
  ])
  const scale = Math.min(
    1,
    MAX_PHOTO_OUTPUT_SIDE / Math.max(frame.canvasWidth, frame.canvasHeight),
  )
  const width = Math.max(1, Math.round(frame.canvasWidth * scale))
  const height = Math.max(1, Math.round(frame.canvasHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = requiredContext(canvas)

  drawFrameComposition(context, width, height, images, overlay, frame, 0)
  return canvasToBlob(canvas, 'image/png')
}

function drawFrameComposition(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  images: HTMLImageElement[],
  overlay: HTMLImageElement,
  frame: PhotoboothFrame,
  offset: number,
) {
  context.clearRect(0, 0, width, height)
  frame.slots.forEach((slot, slotIndex) => {
    const image = images[(slotIndex + offset) % images.length]
    if (!image) return
    drawImageCover(
      context,
      image,
      Math.round(slot.x * width),
      Math.round(slot.y * height),
      Math.ceil(slot.width * width),
      Math.ceil(slot.height * height),
    )
  })
  context.drawImage(overlay, 0, 0, width, height)
}

function requiredContext(canvas: HTMLCanvasElement, readOften = false) {
  const context = canvas.getContext('2d', { willReadFrequently: readOften })
  if (!context) throw new Error('Canvas is unavailable.')
  return context
}

function drawVideoCover(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) {
  const videoWidth = video.videoWidth || width
  const videoHeight = video.videoHeight || height
  const scale = Math.max(width / videoWidth, height / videoHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (videoWidth - sourceWidth) / 2
  const sourceY = (videoHeight - sourceHeight) / 2
  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  )
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  )
}

function drawFilmRails(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = 'rgba(255,255,255,0.72)'
  for (let y = 26; y < height - 34; y += 42) {
    context.fillRect(18, y, 18, 22)
    context.fillRect(width - 36, y, 18, 22)
  }
}

function drawCaption(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  frameColor: string,
  caption: string,
) {
  context.fillStyle = isDark(frameColor) ? 'rgba(255,255,255,0.9)' : 'rgba(76,54,48,0.82)'
  context.font = '600 22px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(caption, width / 2, height - 38)
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    if (/^https?:\/\//.test(source)) image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Photo could not be loaded.'))
    image.src = source
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Image could not be created.'))
    }, type)
  })
}

function isDark(color: string) {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return false
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 < 150
}
