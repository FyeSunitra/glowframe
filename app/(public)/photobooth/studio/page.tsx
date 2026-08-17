'use client'

import {
  ArrowLeft,
  Camera,
  Check,
  Download,
  Film,
  Images,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { FramePreview } from '@/components/features/photobooth/FramePreview'
import {
  captureVideoFrame,
  createAnimatedGif,
  createPhotoStrip,
} from '@/components/features/photobooth/photoboothCanvas'
import { Button } from '@/components/ui/button'
import { getPageText } from '@/lib/menuI18n'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import type {
  PhotoboothFrameStyle,
  PhotoboothOutputType,
} from '@/types/photobooth'

type StudioPhase = 'setup' | 'camera' | 'result'

const FRAME_COLORS = [
  '#f4ccd5',
  '#fffdf8',
  '#f5df7d',
  '#b7d9c2',
  '#9fc7df',
  '#4c3630',
]

export default function PhotoboothStudioPage() {
  return (
    <Suspense fallback={<StudioFallback />}>
      <PhotoboothStudio />
    </Suspense>
  )
}

function PhotoboothStudio() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'photobooth')
  const searchParams = useSearchParams()
  const frameStyle = parseFrameStyle(searchParams.get('frame'))
  const [phase, setPhase] = useState<StudioPhase>('setup')
  const [photoCount, setPhotoCount] = useState<2 | 3 | 4>(3)
  const [frameColor, setFrameColor] = useState(() => defaultFrameColor(frameStyle))
  const [countdownSeconds, setCountdownSeconds] = useState<8 | 10>(8)
  const [outputType, setOutputType] = useState<PhotoboothOutputType>('photo')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [shotIndex, setShotIndex] = useState(0)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [resultError, setResultError] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureSessionRef = useRef(0)

  useEffect(() => {
    if (phase !== 'camera' || !videoRef.current || !streamRef.current) return
    videoRef.current.srcObject = streamRef.current
    void videoRef.current.play()
  }, [phase])

  useEffect(() => {
    return () => {
      captureSessionRef.current += 1
      stopCamera(streamRef)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  useEffect(() => {
    return () => {
      if (gifUrl) URL.revokeObjectURL(gifUrl)
    }
  }, [gifUrl])

  async function openCamera() {
    clearResults()
    setCameraError(null)
    setResultError(null)
    setCapturedImages([])
    setShotIndex(0)
    setIsCameraReady(false)

    if (!window.isSecureContext) {
      setCameraError(t.secureContext)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      })
      streamRef.current = stream
      setPhase('camera')
    } catch (error) {
      console.error('Failed to open photobooth camera', error)
      setCameraError(t.cameraUnavailable)
    }
  }

  async function startCapture() {
    const video = videoRef.current
    if (!video || !isCameraReady || isCapturing) return

    const session = captureSessionRef.current + 1
    captureSessionRef.current = session
    const shots: string[] = []
    setIsCapturing(true)
    setResultError(null)

    try {
      for (let index = 0; index < photoCount; index += 1) {
        setShotIndex(index)
        for (let remaining = countdownSeconds; remaining > 0; remaining -= 1) {
          if (captureSessionRef.current !== session) return
          setCountdown(remaining)
          await wait(1000)
        }
        if (captureSessionRef.current !== session) return

        setCountdown(null)
        const image = captureVideoFrame(video)
        shots.push(image)
        setCapturedImages([...shots])
        setFlash(true)
        await wait(140)
        setFlash(false)
        if (index < photoCount - 1) await wait(500)
      }

      if (captureSessionRef.current !== session) return
      stopCamera(streamRef)
      setIsCreating(true)
      setPhase('result')

      const photoBlob = await createPhotoStrip(shots, frameColor, frameStyle)
      if (captureSessionRef.current !== session) return
      setPhotoUrl(URL.createObjectURL(photoBlob))

      if (outputType === 'gif') {
        const gifBlob = await createAnimatedGif(shots, frameColor, frameStyle)
        if (captureSessionRef.current !== session) return
        setGifUrl(URL.createObjectURL(gifBlob))
      }
    } catch (error) {
      console.error('Failed to create photobooth result', error)
      setResultError(t.resultFailed)
      setPhase('result')
    } finally {
      if (captureSessionRef.current === session) {
        setCountdown(null)
        setIsCapturing(false)
        setIsCreating(false)
      }
    }
  }

  function cancelCamera() {
    captureSessionRef.current += 1
    stopCamera(streamRef)
    setCountdown(null)
    setIsCapturing(false)
    setIsCameraReady(false)
    setPhase('setup')
  }

  function retake() {
    clearResults()
    setPhase('setup')
    setCapturedImages([])
    setResultError(null)
  }

  function clearResults() {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    if (gifUrl) URL.revokeObjectURL(gifUrl)
    setPhotoUrl(null)
    setGifUrl(null)
  }

  const styleName = t[frameStyle]

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.breadcrumb, t.studio]} />

      {phase === 'setup' && (
        <SetupPanel
          t={t}
          style={frameStyle}
          styleName={styleName}
          photoCount={photoCount}
          frameColor={frameColor}
          countdownSeconds={countdownSeconds}
          outputType={outputType}
          cameraError={cameraError}
          onPhotoCountChange={setPhotoCount}
          onFrameColorChange={setFrameColor}
          onCountdownChange={setCountdownSeconds}
          onOutputTypeChange={setOutputType}
          onOpenCamera={() => void openCamera()}
        />
      )}

      {phase === 'camera' && (
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="m-0 text-2xl font-bold text-gf-brown-900">{t.cameraTitle}</h1>
              <p className="mb-0 mt-1.5 text-sm text-gf-muted">{t.cameraReady}</p>
            </div>
            <div className="text-sm font-semibold text-gf-brown-700">
              {t.shotProgress} {Math.min(shotIndex + 1, photoCount)} {t.of} {photoCount}
            </div>
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[920px] overflow-hidden rounded-[8px] bg-gf-brown-900 shadow-[var(--gf-shadow)]">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={() => setIsCameraReady(true)}
                className="h-full w-full -scale-x-100 object-cover"
              />
              <div className="pointer-events-none absolute inset-5 border border-white/35" />
              {countdown !== null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/28 text-white">
                  <span className="text-[clamp(72px,16vw,150px)] font-bold leading-none">{countdown}</span>
                  <span className="mt-3 text-sm font-semibold">{t.lookAtCamera}</span>
                </div>
              )}
              {flash && <div className="absolute inset-0 bg-white" />}
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gf-brown-900 text-sm text-white/75">
                  {t.cameraPermission}
                </div>
              )}
            </div>

            <aside className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-1">
              {Array.from({ length: photoCount }, (_, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] overflow-hidden rounded-[6px] border border-gf-line bg-white"
                  style={
                    capturedImages[index]
                      ? {
                          backgroundImage: `url(${capturedImages[index]})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }
                      : undefined
                  }
                >
                  {!capturedImages[index] && (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gf-muted">
                      {index + 1}
                    </span>
                  )}
                  {capturedImages[index] && (
                    <Check className="absolute right-1.5 top-1.5 rounded-full bg-white p-1 text-emerald-600" size={24} />
                  )}
                </div>
              ))}
            </aside>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={cancelCamera}>
              <ArrowLeft />
              {t.cancel}
            </Button>
            <Button onClick={() => void startCapture()} disabled={!isCameraReady || isCapturing}>
              <Camera />
              {isCapturing ? `${t.shotProgress} ${shotIndex + 1}` : t.startCapture}
            </Button>
          </div>
        </section>
      )}

      {phase === 'result' && (
        <section>
          <header className="mb-6 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gf-pink-300 text-gf-brown-900">
              <Sparkles size={23} />
            </div>
            <h1 className="m-0 text-2xl font-bold text-gf-brown-900">{t.resultTitle}</h1>
            <p className="mb-0 mt-2 text-sm text-gf-muted">{t.resultSubtitle}</p>
          </header>

          {isCreating ? (
            <div className="py-24 text-center text-sm text-gf-muted">{t.creatingResult}</div>
          ) : resultError ? (
            <div className="mx-auto max-w-xl rounded-[8px] border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
              {resultError}
            </div>
          ) : (
            <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex min-h-[520px] items-center justify-center overflow-hidden rounded-[8px] bg-white p-4 shadow-[var(--gf-shadow-sm)] sm:p-7">
                <div
                  role="img"
                  aria-label={t.resultTitle}
                  className="h-[min(66vh,720px)] w-full bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${outputType === 'gif' ? gifUrl : photoUrl})` }}
                />
              </div>

              <div className="space-y-3">
                {outputType === 'gif' && gifUrl && (
                  <DownloadLink href={gifUrl} fileName="glowframe-photobooth.gif">
                    <Film />
                    {t.downloadGif}
                  </DownloadLink>
                )}
                {photoUrl && (
                  <DownloadLink href={photoUrl} fileName="glowframe-photobooth.png" secondary={outputType === 'gif'}>
                    <Download />
                    {outputType === 'gif' ? t.downloadStillToo : t.downloadPhoto}
                  </DownloadLink>
                )}
                <Button className="w-full" variant="outline" onClick={retake}>
                  <RefreshCcw />
                  {t.retake}
                </Button>
                <Link
                  href="/photobooth"
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-gf-brown-700 underline"
                >
                  <Images size={17} />
                  {t.backToFrames}
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

interface SetupPanelProps {
  t: ReturnType<typeof getPageText<'photobooth'>>
  style: PhotoboothFrameStyle
  styleName: string
  photoCount: 2 | 3 | 4
  frameColor: string
  countdownSeconds: 8 | 10
  outputType: PhotoboothOutputType
  cameraError: string | null
  onPhotoCountChange: (value: 2 | 3 | 4) => void
  onFrameColorChange: (value: string) => void
  onCountdownChange: (value: 8 | 10) => void
  onOutputTypeChange: (value: PhotoboothOutputType) => void
  onOpenCamera: () => void
}

function SetupPanel({
  t,
  style,
  styleName,
  photoCount,
  frameColor,
  countdownSeconds,
  outputType,
  cameraError,
  onPhotoCountChange,
  onFrameColorChange,
  onCountdownChange,
  onOutputTypeChange,
  onOpenCamera,
}: SetupPanelProps) {
  return (
    <section className="grid items-start gap-8 lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.28fr)]">
      <div className="lg:sticky lg:top-24">
        <p className="mb-3 mt-0 text-xs font-semibold uppercase text-gf-muted">{t.preview}</p>
        <div className="flex min-h-[460px] items-center justify-center bg-gf-pink-100/55 px-8 py-8">
          <FramePreview style={style} color={frameColor} count={photoCount} />
        </div>
        <div className="mt-3 text-center text-sm font-semibold text-gf-brown-700">{styleName}</div>
      </div>

      <div className="rounded-[8px] bg-white p-5 shadow-[var(--gf-shadow-sm)] sm:p-7">
        <h1 className="m-0 text-2xl font-bold text-gf-brown-900">{t.setupTitle}</h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-gf-muted">{t.setupSubtitle}</p>

        <SettingSection icon={Images} title={t.photoCount}>
          <SegmentedOptions
            options={([2, 3, 4] as const).map((value) => ({
              value,
              label: `${value} ${t.shots}`,
            }))}
            value={photoCount}
            onChange={onPhotoCountChange}
          />
        </SettingSection>

        <SettingSection icon={Sparkles} title={t.frameColor}>
          <div className="flex flex-wrap gap-3">
            {FRAME_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onFrameColorChange(color)}
                className={cn(
                  'relative size-10 rounded-full border-2 transition-transform hover:scale-105',
                  frameColor === color ? 'border-gf-brown-800' : 'border-white shadow-[0_0_0_1px_var(--gf-line)]',
                )}
                style={{ backgroundColor: color }}
                aria-label={`${t.frameColor} ${color}`}
                aria-pressed={frameColor === color}
              >
                {frameColor === color && (
                  <Check
                    className={color === '#4c3630' ? 'text-white' : 'text-gf-brown-900'}
                    size={18}
                  />
                )}
              </button>
            ))}
          </div>
        </SettingSection>

        <SettingSection icon={Timer} title={t.countdownTime}>
          <SegmentedOptions
            options={([8, 10] as const).map((value) => ({
              value,
              label: `${value} ${t.seconds}`,
            }))}
            value={countdownSeconds}
            onChange={onCountdownChange}
          />
        </SettingSection>

        <SettingSection icon={Film} title={t.outputType} last>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['photo', 'gif'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onOutputTypeChange(value)}
                className={cn(
                  'min-h-[96px] rounded-[8px] border p-4 text-left transition-colors',
                  outputType === value
                    ? 'border-gf-pink-500 bg-gf-pink-100 text-gf-brown-900'
                    : 'border-gf-line bg-white text-gf-brown-700 hover:border-gf-pink-300',
                )}
              >
                <span className="block text-sm font-bold">
                  {value === 'photo' ? t.stillPhoto : t.animatedGif}
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-gf-muted">
                  {value === 'photo' ? t.stillDescription : t.gifDescription}
                </span>
              </button>
            ))}
          </div>
        </SettingSection>

        {cameraError && (
          <div className="mb-4 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {cameraError}
          </div>
        )}

        <Button className="h-12 w-full" onClick={onOpenCamera}>
          <Camera />
          {t.openCamera}
        </Button>
        <p className="mb-0 mt-3 flex items-start justify-center gap-2 text-center text-xs leading-5 text-gf-muted">
          <ShieldCheck className="mt-0.5 shrink-0" size={15} />
          {t.privacyNote}
        </p>
      </div>
    </section>
  )
}

function SettingSection({
  icon: Icon,
  title,
  children,
  last = false,
}: {
  icon: typeof Camera
  title: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={cn('border-b border-gf-line py-5 first:pt-0', last && 'border-b-0')}>
      <h2 className="mb-3 mt-0 flex items-center gap-2 text-sm font-bold text-gf-brown-900">
        <Icon size={17} className="text-gf-pink-600" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function SegmentedOptions<T extends number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 rounded-[8px] bg-gf-pink-100 p-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-10 rounded-[6px] border-0 px-3 text-sm font-semibold transition-colors',
            value === option.value
              ? 'bg-white text-gf-brown-900 shadow-sm'
              : 'bg-transparent text-gf-brown-700 hover:bg-white/55',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function DownloadLink({
  href,
  fileName,
  children,
  secondary = false,
}: {
  href: string
  fileName: string
  children: React.ReactNode
  secondary?: boolean
}) {
  return (
    <a
      href={href}
      download={fileName}
      className={cn(
        'flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold no-underline',
        secondary
          ? 'border-gf-line bg-white text-gf-brown-800'
          : 'border-transparent bg-gf-pink-500 text-gf-brown-900 hover:bg-gf-pink-600',
      )}
    >
      {children}
    </a>
  )
}

function stopCamera(streamRef: React.MutableRefObject<MediaStream | null>) {
  streamRef.current?.getTracks().forEach((track) => track.stop())
  streamRef.current = null
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function parseFrameStyle(value: string | null): PhotoboothFrameStyle {
  return value === 'film' || value === 'minimal' ? value : 'classic'
}

function defaultFrameColor(style: PhotoboothFrameStyle) {
  if (style === 'film') return '#4c3630'
  if (style === 'minimal') return '#fffdf8'
  return FRAME_COLORS[0]
}

function StudioFallback() {
  const t = getPageText(useAppStore((state) => state.locale), 'catalog')
  return <div className="py-24 text-center text-sm text-gf-muted">{t.loading}</div>
}
