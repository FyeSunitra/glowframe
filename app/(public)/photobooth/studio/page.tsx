'use client'

import {
  ArrowLeft,
  Camera,
  Check,
  CreditCard,
  Download,
  Film,
  Images,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { FramePreview } from '@/components/features/photobooth/FramePreview'
import {
  captureVideoFrame,
  createAnimatedGif,
  createFramedGif,
  createFramedPhoto,
  createPhotoStrip,
} from '@/components/features/photobooth/photoboothCanvas'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn } from '@/lib/utils'
import { photoboothService } from '@/services/photobooth'
import { useAppStore } from '@/store/appStore'
import type {
  PhotoboothFrameStyle,
  PhotoboothFrame,
  PhotoboothOutputType,
} from '@/types/photobooth'

type StudioPhase = 'setup' | 'camera' | 'result'

const COUNTDOWN_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10] as const
type CountdownSeconds = (typeof COUNTDOWN_OPTIONS)[number]

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
  const frameId = searchParams.get('frameId')
  const paymentId = searchParams.get('paymentId')
  const frameStyle = parseFrameStyle(searchParams.get('frame'))
  const [phase, setPhase] = useState<StudioPhase>('setup')
  const [selectedPhotoCount, setPhotoCount] = useState(3)
  const [frameColor, setFrameColor] = useState(() => defaultFrameColor(frameStyle))
  const [countdownSeconds, setCountdownSeconds] = useState<CountdownSeconds>(8)
  const [noticeAccepted, setNoticeAccepted] = useState(false)
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
  const {
    data: databaseFrame,
    isLoading: isFrameLoading,
    isError: isFrameError,
  } = useQuery({
    queryKey: ['photobooth-frame', frameId],
    queryFn: async () => unwrapApiResponse(await photoboothService.get(frameId as string)),
    enabled: Boolean(frameId && /^\d+$/.test(frameId)),
  })
  const requiresPayment = Boolean(databaseFrame?.price && databaseFrame.price > 0)
  const {
    data: frameAccess,
    isLoading: isAccessLoading,
    isError: isAccessError,
  } = useQuery({
    queryKey: ['photobooth-frame-access', frameId, paymentId],
    queryFn: async () => unwrapApiResponse(
      await photoboothService.checkFrameAccess(frameId as string, paymentId),
    ),
    enabled: Boolean(databaseFrame && requiresPayment && paymentId),
    retry: false,
  })
  const photoCount = databaseFrame?.frameCount ?? selectedPhotoCount

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

      const photoBlob = databaseFrame
        ? await createFramedPhoto(shots, databaseFrame)
        : await createPhotoStrip(shots, frameColor, frameStyle)
      if (captureSessionRef.current !== session) return
      setPhotoUrl(URL.createObjectURL(photoBlob))

      if (outputType === 'gif') {
        const gifBlob = databaseFrame
          ? await createFramedGif(shots, databaseFrame)
          : await createAnimatedGif(shots, frameColor, frameStyle)
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

  const styleName = databaseFrame
    ? locale === 'th' ? databaseFrame.nameTh : databaseFrame.nameEn
    : t[frameStyle]

  if (frameId && isFrameLoading) {
    return <div className="py-24 text-center text-sm text-gf-muted">{t.loading}</div>
  }
  if (frameId && (isFrameError || !databaseFrame)) {
    return <div className="py-24 text-center text-sm text-gf-muted">{t.noFrames}</div>
  }
  if (databaseFrame && requiresPayment && !paymentId) {
    return <PaymentAccessRequired t={t} />
  }
  if (databaseFrame && requiresPayment && isAccessLoading) {
    return <div className="py-24 text-center text-sm text-gf-muted">{t.accessChecking}</div>
  }
  if (databaseFrame && requiresPayment && (isAccessError || !frameAccess?.allowed)) {
    return <PaymentAccessRequired t={t} />
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.breadcrumb, t.studio]} />

      <PhotoNoticeDialog
        open={Boolean(frameId && databaseFrame && !noticeAccepted)}
        t={t}
        onAccept={() => setNoticeAccepted(true)}
      />

      {phase === 'setup' && (
        <SetupPanel
          t={t}
          style={frameStyle}
          databaseFrame={databaseFrame}
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

function PaymentAccessRequired({
  t,
}: {
  t: ReturnType<typeof getPageText<'photobooth'>>
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-gf-pink-100 text-gf-brown-800">
        <CreditCard size={25} />
      </span>
      <h1 className="mb-0 mt-5 text-xl font-bold text-gf-brown-900 sm:text-2xl">
        {t.accessRequiredTitle}
      </h1>
      <p className="mb-0 mt-2 max-w-md text-sm leading-6 text-gf-muted">
        {t.accessRequiredDescription}
      </p>
      <Link
        href="/photobooth"
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gf-pink-500 px-6 text-sm font-semibold text-gf-brown-900 no-underline hover:bg-gf-pink-600"
      >
        <ArrowLeft size={17} />
        {t.backToPayment}
      </Link>
    </section>
  )
}

interface SetupPanelProps {
  t: ReturnType<typeof getPageText<'photobooth'>>
  style: PhotoboothFrameStyle
  styleName: string
  databaseFrame?: PhotoboothFrame
  photoCount: number
  frameColor: string
  countdownSeconds: CountdownSeconds
  outputType: PhotoboothOutputType
  cameraError: string | null
  onPhotoCountChange: (value: 2 | 3 | 4) => void
  onFrameColorChange: (value: string) => void
  onCountdownChange: (value: CountdownSeconds) => void
  onOutputTypeChange: (value: PhotoboothOutputType) => void
  onOpenCamera: () => void
}

function PhotoNoticeDialog({
  open,
  t,
  onAccept,
}: {
  open: boolean
  t: ReturnType<typeof getPageText<'photobooth'>>
  onAccept: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-none overflow-y-auto p-0 sm:max-w-[720px]"
      >
        <DialogHeader className="border-b border-gf-line px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gf-pink-100 text-gf-brown-800">
              <ShieldCheck size={22} />
            </span>
            <DialogTitle className="text-lg leading-6 text-gf-brown-900 sm:text-xl">
              {t.photoNoticeTitle}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5 text-sm leading-7 text-gf-brown-800 sm:px-8 sm:py-6">
          <p className="m-0 font-medium">{t.photoNoticeLead}</p>
          <div className="space-y-3 border-l-2 border-gf-pink-400 pl-4">
            <p className="m-0">{t.photoNoticeAdvice}</p>
            <p className="m-0">{t.photoNoticeProcessing}</p>
          </div>
          <div className="rounded-[8px] border border-gf-pink-300 bg-gf-pink-100/60 px-4 py-3.5">
            <p className="m-0 font-semibold text-gf-brown-900">{t.photoNoticeRefund}</p>
          </div>
          <p className="m-0 text-center font-semibold text-gf-brown-900">
            {t.photoNoticeReady}
          </p>
        </div>

        <div className="border-t border-gf-line px-6 py-4 sm:px-8">
          <Button className="h-12 w-full" onClick={onAccept}>
            <Check />
            {t.acceptPhotoNotice}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SetupPanel({
  t,
  style,
  databaseFrame,
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
    <section className="grid min-w-0 items-start gap-7 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] xl:gap-10">
      <div className="min-w-0 xl:sticky xl:top-24">
        <p className="mb-3 mt-0 text-xs font-semibold uppercase text-gf-muted">{t.preview}</p>
        <div className="flex h-[min(58vh,340px)] min-h-[260px] min-w-0 items-center justify-center overflow-hidden bg-gf-pink-100/40 px-4 py-5 sm:h-[420px] sm:px-7 sm:py-7 xl:h-[min(62vh,520px)]">
          {databaseFrame ? (
            <DatabaseFramePreview frame={databaseFrame} />
          ) : (
            <FramePreview style={style} color={frameColor} count={photoCount} />
          )}
        </div>
        <div className="mt-3 text-center text-sm font-semibold text-gf-brown-700">{styleName}</div>
      </div>

      <div className="min-w-0">
        <header className="border-b border-gf-line pb-5">
          <h1 className="m-0 text-xl font-bold text-gf-brown-900 sm:text-2xl">{t.setupTitle}</h1>
          {!databaseFrame && (
            <p className="mb-0 mt-2 text-sm leading-6 text-gf-muted">{t.setupSubtitle}</p>
          )}
        </header>

        <SettingSection icon={Images} title={t.photoCount}>
          {databaseFrame ? (
            <div className="inline-flex min-h-12 items-baseline gap-2 border-b-2 border-gf-pink-400 px-1 py-2 text-gf-brown-900">
              <strong className="text-2xl">{photoCount}</strong>
              <span className="text-sm font-medium text-gf-muted">{t.shots}</span>
            </div>
          ) : (
            <SegmentedOptions
              options={([2, 3, 4] as const).map((value) => ({
                value,
                label: `${value} ${t.shots}`,
              }))}
              value={photoCount as 2 | 3 | 4}
              onChange={onPhotoCountChange}
            />
          )}
        </SettingSection>

        <SettingSection icon={Timer} title={t.countdownTime}>
          <CountdownStepper
            value={countdownSeconds}
            onChange={onCountdownChange}
            secondsLabel={t.seconds}
            decreaseLabel={t.decreaseCountdown}
            increaseLabel={t.increaseCountdown}
          />
        </SettingSection>

        {!databaseFrame && (
          <SettingSection icon={Sparkles} title={t.frameColor}>
            <div className="flex flex-wrap gap-3">
              {FRAME_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onFrameColorChange(color)}
                  className={cn(
                    'relative size-10 rounded-full border-2 transition-transform hover:scale-105',
                    frameColor === color
                      ? 'border-gf-brown-800'
                      : 'border-white shadow-[0_0_0_1px_var(--gf-line)]',
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
        )}

        <SettingSection icon={Film} title={t.outputType} last>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['photo', 'gif'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onOutputTypeChange(value)}
                className={cn(
                  'relative min-h-[108px] rounded-[8px] border px-4 py-3.5 text-left transition-[background-color,border-color]',
                  outputType === value
                    ? 'border-gf-pink-500 bg-gf-pink-100/55 text-gf-brown-900'
                    : 'border-gf-line bg-transparent text-gf-brown-700 hover:border-gf-pink-300',
                )}
              >
                <span className="mb-2 flex size-8 items-center justify-center rounded-full border border-gf-line bg-white text-gf-brown-800">
                  {value === 'photo' ? <Images size={16} /> : <Film size={16} />}
                </span>
                <span className="block text-sm font-bold">
                  {value === 'photo' ? t.stillPhoto : t.animatedGif}
                </span>
                <span className="mt-1 block text-xs leading-5 text-gf-muted">
                  {value === 'photo' ? t.stillDescription : t.gifDescription}
                </span>
                {outputType === value && (
                  <Check className="absolute right-3 top-3 text-gf-pink-600" size={17} />
                )}
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

function DatabaseFramePreview({ frame }: { frame: PhotoboothFrame }) {
  const landscape = frame.canvasWidth >= frame.canvasHeight
  return (
    <div
      className="relative max-h-full max-w-full overflow-hidden shadow-[0_14px_34px_rgba(76,54,48,0.16)]"
      style={{
        aspectRatio: `${frame.canvasWidth}/${frame.canvasHeight}`,
        width: landscape ? '100%' : undefined,
        height: landscape ? undefined : '100%',
      }}
    >
      {frame.slots.map((slot, index) => (
        <div
          key={index}
          className="absolute bg-[linear-gradient(135deg,#f9e5ea,#d8c7bd)]"
          style={{
            left: `${slot.x * 100}%`,
            top: `${slot.y * 100}%`,
            width: `${slot.width * 100}%`,
            height: `${slot.height * 100}%`,
          }}
        />
      ))}
      <NextImage
        src={frame.overlayUrl}
        alt={frame.nameEn}
        fill
        unoptimized
        className="object-contain"
      />
    </div>
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
    <div
      className={cn(
        'grid min-w-0 gap-3 border-b border-gf-line py-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6 sm:py-6',
        last && 'border-b-0',
      )}
    >
      <h2 className="m-0 flex items-start gap-2 pt-1 text-sm font-bold text-gf-brown-900">
        <Icon size={17} className="text-gf-pink-600" />
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-1 border-b border-gf-line p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-10 border-0 border-b-2 px-3 text-sm font-semibold transition-colors',
            value === option.value
              ? 'border-gf-pink-500 bg-transparent text-gf-brown-900'
              : 'border-transparent bg-transparent text-gf-brown-700 hover:bg-gf-pink-100/50',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function CountdownStepper({
  value,
  onChange,
  secondsLabel,
  decreaseLabel,
  increaseLabel,
}: {
  value: CountdownSeconds
  onChange: (value: CountdownSeconds) => void
  secondsLabel: string
  decreaseLabel: string
  increaseLabel: string
}) {
  const minimum = COUNTDOWN_OPTIONS[0]
  const maximum = COUNTDOWN_OPTIONS[COUNTDOWN_OPTIONS.length - 1]

  const changeBy = (difference: -1 | 1) => {
    const nextValue = Math.min(maximum, Math.max(minimum, value + difference))
    onChange(nextValue as CountdownSeconds)
  }

  return (
    <div className="grid w-full max-w-[300px] grid-cols-[48px_minmax(110px,1fr)_48px] items-center gap-3">
      <button
        type="button"
        title={decreaseLabel}
        aria-label={decreaseLabel}
        disabled={value <= minimum}
        onClick={() => changeBy(-1)}
        className="flex size-12 items-center justify-center rounded-full border border-gf-line bg-white text-gf-brown-800 transition-[background-color,border-color,opacity] hover:border-gf-pink-400 hover:bg-gf-pink-100 disabled:pointer-events-none disabled:opacity-35"
      >
        <Minus size={20} />
      </button>

      <div
        className="flex h-20 min-w-0 flex-col items-center justify-center border-y border-gf-line text-center"
        aria-live="polite"
      >
        <strong className="text-4xl leading-none text-gf-brown-900 tabular-nums">{value}</strong>
        <span className="mt-1 text-xs font-medium text-gf-muted">{secondsLabel}</span>
      </div>

      <button
        type="button"
        title={increaseLabel}
        aria-label={increaseLabel}
        disabled={value >= maximum}
        onClick={() => changeBy(1)}
        className="flex size-12 items-center justify-center rounded-full border border-gf-line bg-white text-gf-brown-800 transition-[background-color,border-color,opacity] hover:border-gf-pink-400 hover:bg-gf-pink-100 disabled:pointer-events-none disabled:opacity-35"
      >
        <Plus size={20} />
      </button>
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
