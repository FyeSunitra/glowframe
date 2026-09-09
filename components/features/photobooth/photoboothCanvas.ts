import type {
  PhotoboothDefaultFrameLayout,
  PhotoboothFrame,
  PhotoboothFrameStyle,
} from '@/types/photobooth'

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

  // Keep the captured frame lossless until each final output format encodes it.
  return canvas.toDataURL('image/png')
}

export async function createPhotoStrip(
  sources: string[],
  frameColor: string,
  style: PhotoboothFrameStyle,
  layout: PhotoboothDefaultFrameLayout = 'portrait',
) {
  const images = await Promise.all(sources.map(loadImage))
  const width = 900
  const height = 1200
  const sidePadding = style === 'minimal' ? 28 : style === 'film' ? 76 : 52
  const topPadding = style === 'minimal' ? 28 : 48
  const gap = style === 'minimal' ? 10 : 18
  const footer = style === 'minimal' ? 72 : 92
  const columns = layout === 'grid' ? 2 : 1
  const rows = Math.ceil(images.length / columns)
  const photoWidth = Math.floor((width - sidePadding * 2 - (columns - 1) * gap) / columns)
  const photoHeight = Math.floor((height - topPadding - footer - (rows - 1) * gap) / rows)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = requiredContext(canvas)

  context.fillStyle = frameColor
  context.fillRect(0, 0, width, height)
  if (style === 'film') drawFilmRails(context, width, height)

  images.forEach((image, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = sidePadding + column * (photoWidth + gap)
    const y = topPadding + row * (photoHeight + gap)
    drawImageCover(context, image, x, y, photoWidth, photoHeight)
    if (style === 'minimal') {
      context.strokeStyle = 'rgba(76,54,48,0.18)'
      context.lineWidth = 2
      context.strokeRect(x, y, photoWidth, photoHeight)
    }
  })

  drawCaption(context, width, height, frameColor, 'GlowFrame Photobooth')
  return canvasToBlob(canvas, 'image/png')
}

export async function createAnimatedGif(
  sources: string[],
) {
  const [{ GIFEncoder, quantize }, images] = await Promise.all([
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

  for (const image of images) {
    context.clearRect(0, 0, width, height)
    drawImageCover(context, image, 0, 0, width, height)
    const rgba = context.getImageData(0, 0, width, height).data
    // Build a tailored 256-color palette per photograph, then preserve tonal
    // transitions with serpentine Floyd-Steinberg error diffusion.
    const palette = quantize(rgba, 256, { format: 'rgb565' })
    const indexed = ditherToPalette(rgba, width, height, palette)
    encoder.writeFrame(indexed, width, height, {
      palette,
      delay: 900,
      repeat: 0,
    })
    await yieldToBrowser()
  }

  encoder.finish()
  const bytes = encoder.bytes()
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return new Blob([copy.buffer], { type: 'image/gif' })
}

export async function createAnimatedWebM(sources: string[]) {
  if (!('MediaRecorder' in window)) {
    throw new Error('This browser does not support video export.')
  }

  const images = await Promise.all(sources.map(loadImage))
  const firstImage = images[0]
  if (!firstImage) throw new Error('At least one photo is required to create a video.')

  const width = firstImage.naturalWidth
  const height = firstImage.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = requiredContext(canvas)
  const stream = canvas.captureStream(30)
  const mimeType = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ].find((type) => MediaRecorder.isTypeSupported(type))
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
    : new MediaRecorder(stream)
  const chunks: BlobPart[] = []

  const completed = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onerror = () => reject(new Error('Video export failed.'))
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
  })

  try {
    drawImageCover(context, firstImage, 0, 0, width, height)
    recorder.start()

    for (const image of images) {
      context.clearRect(0, 0, width, height)
      drawImageCover(context, image, 0, 0, width, height)
      await delay(900)
    }

    recorder.stop()
    return await completed
  } finally {
    if (recorder.state !== 'inactive') recorder.stop()
    stream.getTracks().forEach((track) => track.stop())
  }
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

function ditherToPalette(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  palette: number[][],
) {
  const indexed = new Uint8Array(width * height)
  const paletteLookup = new Int16Array(1 << 15)
  paletteLookup.fill(-1)
  let currentRed = new Float32Array(width + 2)
  let currentGreen = new Float32Array(width + 2)
  let currentBlue = new Float32Array(width + 2)
  let nextRed = new Float32Array(width + 2)
  let nextGreen = new Float32Array(width + 2)
  let nextBlue = new Float32Array(width + 2)

  for (let y = 0; y < height; y += 1) {
    const rightToLeft = y % 2 === 1
    const start = rightToLeft ? width - 1 : 0
    const end = rightToLeft ? -1 : width
    const step = rightToLeft ? -1 : 1

    for (let x = start; x !== end; x += step) {
      const pixelOffset = (y * width + x) * 4
      const errorOffset = x + 1
      const red = clampColor(rgba[pixelOffset] + currentRed[errorOffset])
      const green = clampColor(rgba[pixelOffset + 1] + currentGreen[errorOffset])
      const blue = clampColor(rgba[pixelOffset + 2] + currentBlue[errorOffset])
      const paletteIndex = findPaletteIndex(red, green, blue, palette, paletteLookup)
      const color = palette[paletteIndex]
      const redError = red - color[0]
      const greenError = green - color[1]
      const blueError = blue - color[2]

      indexed[y * width + x] = paletteIndex

      if (rightToLeft) {
        currentRed[errorOffset - 1] += redError * (7 / 16)
        currentGreen[errorOffset - 1] += greenError * (7 / 16)
        currentBlue[errorOffset - 1] += blueError * (7 / 16)
        nextRed[errorOffset + 1] += redError * (3 / 16)
        nextGreen[errorOffset + 1] += greenError * (3 / 16)
        nextBlue[errorOffset + 1] += blueError * (3 / 16)
        nextRed[errorOffset] += redError * (5 / 16)
        nextGreen[errorOffset] += greenError * (5 / 16)
        nextBlue[errorOffset] += blueError * (5 / 16)
        nextRed[errorOffset - 1] += redError * (1 / 16)
        nextGreen[errorOffset - 1] += greenError * (1 / 16)
        nextBlue[errorOffset - 1] += blueError * (1 / 16)
      } else {
        currentRed[errorOffset + 1] += redError * (7 / 16)
        currentGreen[errorOffset + 1] += greenError * (7 / 16)
        currentBlue[errorOffset + 1] += blueError * (7 / 16)
        nextRed[errorOffset - 1] += redError * (3 / 16)
        nextGreen[errorOffset - 1] += greenError * (3 / 16)
        nextBlue[errorOffset - 1] += blueError * (3 / 16)
        nextRed[errorOffset] += redError * (5 / 16)
        nextGreen[errorOffset] += greenError * (5 / 16)
        nextBlue[errorOffset] += blueError * (5 / 16)
        nextRed[errorOffset + 1] += redError * (1 / 16)
        nextGreen[errorOffset + 1] += greenError * (1 / 16)
        nextBlue[errorOffset + 1] += blueError * (1 / 16)
      }
    }

    ;[currentRed, nextRed] = [nextRed, currentRed]
    ;[currentGreen, nextGreen] = [nextGreen, currentGreen]
    ;[currentBlue, nextBlue] = [nextBlue, currentBlue]
    nextRed.fill(0)
    nextGreen.fill(0)
    nextBlue.fill(0)
  }

  return indexed
}

function findPaletteIndex(
  red: number,
  green: number,
  blue: number,
  palette: number[][],
  lookup: Int16Array,
) {
  const key = ((red >> 3) << 10) | ((green >> 3) << 5) | (blue >> 3)
  const cached = lookup[key]
  if (cached >= 0) return cached

  const sampleRed = (red & 0xf8) + 4
  const sampleGreen = (green & 0xf8) + 4
  const sampleBlue = (blue & 0xf8) + 4
  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  palette.forEach((color, index) => {
    const redDistance = sampleRed - color[0]
    const greenDistance = sampleGreen - color[1]
    const blueDistance = sampleBlue - color[2]
    const distance = redDistance * redDistance + greenDistance * greenDistance + blueDistance * blueDistance
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  lookup[key] = closestIndex
  return closestIndex
}

function clampColor(value: number) {
  return Math.min(255, Math.max(0, value))
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0))
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

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
}

function isDark(color: string) {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return false
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 < 150
}
