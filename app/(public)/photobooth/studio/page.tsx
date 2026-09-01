'use client'

import {
  ArrowLeft,
  Camera,
  Check,
  CreditCard,
  Download,
  Film,
  Images,
  LoaderCircle,
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
  createAnimatedWebM,
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
} from '@/types/photobooth'

type StudioPhase = 'setup' | 'camera' | 'result'
type ResultView = 'photo' | 'motion'

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
  const [resultView, setResultView] = useState<ResultView>('photo')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [shotIndex, setShotIndex] = useState(0)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [motionUrl, setMotionUrl] = useState<string | null>(null)
  const [isExportingGif, setIsExportingGif] = useState(false)
  const [gifExportError, setGifExportError] = useState<string | null>(null)
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
  const photoCount = databaseFrame
    ? databaseFrame.frameCount === 1
      ? selectedPhotoCount
      : databaseFrame.frameCount
    : selectedPhotoCount

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
      if (motionUrl) URL.revokeObjectURL(motionUrl)
    }
  }, [motionUrl])

  async function openCamera() {
    clearResults()
    setCameraError(null)
    setResultError(null)
    setCapturedImages([])
    setShotIndex(0)
    setIsCameraReady(false)
    setResultView('photo')

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

      const motionBlob = await createAnimatedWebM(shots)
      if (captureSessionRef.current !== session) return
      setMotionUrl(URL.createObjectURL(motionBlob))
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
    setResultView('photo')
  }

  function clearResults() {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    if (motionUrl) URL.revokeObjectURL(motionUrl)
    setPhotoUrl(null)
    setMotionUrl(null)
    setGifExportError(null)
  }

  async function exportGif() {
    if (isExportingGif || capturedImages.length === 0) return

    setIsExportingGif(true)
    setGifExportError(null)
    try {
      const gifBlob = await createAnimatedGif(capturedImages)
      const url = URL.createObjectURL(gifBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'glowframe-photobooth.gif'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
    } catch (error) {
      console.error('Failed to export photobooth GIF', error)
      setGifExportError(t.gifExportFailed)
    } finally {
      setIsExportingGif(false)
    }
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
          cameraError={cameraError}
          onPhotoCountChange={setPhotoCount}
          onFrameColorChange={setFrameColor}
          onCountdownChange={setCountdownSeconds}
          onOpenCamera={() => void openCamera()}
        />
      )}

      {phase === 'camera' && (
        <section>
          <div className="mx-auto mb-4 flex w-full max-w-[920px] flex-wrap items-end justify-between gap-x-5 gap-y-2 sm:mb-5">
            <div>
              <h1 className="m-0 text-2xl font-bold text-gf-brown-900">{t.cameraTitle}</h1>
              <p className="mb-0 mt-1.5 text-sm text-gf-muted">{t.cameraReady}</p>
            </div>
            <div className="text-sm font-semibold text-gf-brown-700">
              {t.shotProgress} {Math.min(shotIndex + 1, photoCount)} {t.of} {photoCount}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[920px]">
            <button
              type="button"
              onClick={cancelCamera}
              className="mb-2.5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-gf-brown-700 hover:text-gf-brown-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gf-pink-400 sm:mb-3"
            >
              <ArrowLeft size={18} />
              {t.cancel}
            </button>

            <CameraPreviewStage
              t={t}
              videoRef={videoRef}
              countdown={countdown}
              flash={flash}
              isCameraReady={isCameraReady}
              onCameraReady={() => setIsCameraReady(true)}
            />

            <div className="mt-4 flex items-center justify-center sm:mt-5">
              <button
                type="button"
                onClick={() => void startCapture()}
                disabled={!isCameraReady || isCapturing}
                className="group flex size-20 items-center justify-center rounded-full border-2 border-gf-brown-700 bg-white p-1.5 shadow-[0_8px_24px_rgba(76,54,48,0.2)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gf-pink-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                aria-label={isCapturing ? `${t.shotProgress} ${shotIndex + 1}` : t.startCapture}
                title={t.startCapture}
              >
                <span className="flex size-full items-center justify-center rounded-full bg-gf-pink-500 text-gf-brown-900 transition-colors group-hover:bg-gf-pink-600">
                  <Camera size={27} strokeWidth={2.2} />
                </span>
              </button>
            </div>

            <aside className="mt-3 flex min-h-16 flex-wrap items-start justify-center gap-2 sm:mt-4">
              {Array.from({ length: photoCount }, (_, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] w-16 overflow-hidden rounded-[6px] border border-gf-line bg-white sm:w-20"
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
                    <Check className="absolute right-1 top-1 rounded-full bg-white p-0.5 text-emerald-600 sm:right-1.5 sm:top-1.5 sm:p-1" size={22} />
                  )}
                </div>
              ))}
            </aside>
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
            <div className="mx-auto max-w-5xl">
              <div className="mb-5 flex justify-center">
                <div className="inline-grid grid-cols-2 rounded-full border border-gf-line bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setResultView('photo')}
                    className={cn(
                      'flex min-h-10 items-center justify-center gap-2 rounded-full border-0 px-5 text-sm font-semibold transition-colors',
                      resultView === 'photo'
                        ? 'bg-gf-pink-500 text-gf-brown-900'
                        : 'bg-transparent text-gf-brown-700 hover:bg-gf-pink-100',
                    )}
                    aria-pressed={resultView === 'photo'}
                  >
                    <Images size={16} />
                    {t.stillPhoto}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultView('motion')}
                    disabled={!motionUrl}
                    className={cn(
                      'flex min-h-10 items-center justify-center gap-2 rounded-full border-0 px-5 text-sm font-semibold transition-colors disabled:opacity-40',
                      resultView === 'motion'
                        ? 'bg-gf-pink-500 text-gf-brown-900'
                        : 'bg-transparent text-gf-brown-700 hover:bg-gf-pink-100',
                    )}
                    aria-pressed={resultView === 'motion'}
                  >
                    <Film size={16} />
                    {t.motionPreview}
                  </button>
                </div>
              </div>

              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-[8px] bg-white p-4 shadow-[var(--gf-shadow-sm)] sm:min-h-[520px] sm:p-7">
                  {resultView === 'motion' && motionUrl ? (
                    <video
                      src={motionUrl}
                      className="h-[min(66vh,720px)] max-w-full object-contain"
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={t.resultTitle}
                      className="h-[min(66vh,720px)] w-full bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${photoUrl})` }}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  {motionUrl && (
                    <DownloadLink href={motionUrl} fileName="glowframe-photobooth.webm">
                      <Film />
                      {t.downloadWebm}
                    </DownloadLink>
                  )}
                  {photoUrl && (
                    <DownloadLink href={photoUrl} fileName="glowframe-photobooth.png" secondary>
                      <Download />
                      {t.downloadPhoto}
                    </DownloadLink>
                  )}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => void exportGif()}
                    disabled={isExportingGif || capturedImages.length === 0}
                  >
                    {isExportingGif ? <LoaderCircle className="animate-spin" /> : <Film />}
                    {isExportingGif ? t.exportingGif : t.exportGif}
                  </Button>
                  {gifExportError && (
                    <p className="m-0 text-center text-xs leading-5 text-red-600">{gifExportError}</p>
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
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function CameraPreviewStage({
  t,
  videoRef,
  countdown,
  flash,
  isCameraReady,
  onCameraReady,
}: {
  t: ReturnType<typeof getPageText<'photobooth'>>
  videoRef: React.RefObject<HTMLVideoElement | null>
  countdown: number | null
  flash: boolean
  isCameraReady: boolean
  onCameraReady: () => void
}) {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[920px] overflow-hidden rounded-[8px] bg-gf-brown-900 shadow-[var(--gf-shadow)]">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={onCameraReady}
        className="h-full w-full -scale-x-100 object-cover"
      />
      <div className="pointer-events-none absolute inset-4 border border-white/35 sm:inset-5" />
      <CameraStageFeedback
        t={t}
        countdown={countdown}
        flash={flash}
        isCameraReady={isCameraReady}
      />
    </div>
  )
}

function CameraStageFeedback({
  t,
  countdown,
  flash,
  isCameraReady,
}: {
  t: ReturnType<typeof getPageText<'photobooth'>>
  countdown: number | null
  flash: boolean
  isCameraReady: boolean
}) {
  return (
    <>
      {countdown !== null && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/25 text-white">
          <span className="text-[clamp(64px,14vw,140px)] font-bold leading-none drop-shadow-md">
            {countdown}
          </span>
          <span className="mt-3 text-sm font-semibold drop-shadow-md">{t.lookAtCamera}</span>
        </div>
      )}
      {flash && <div className="absolute inset-0 z-40 bg-white" />}
      {!isCameraReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gf-brown-900 px-5 text-center text-sm text-white/75">
          {t.cameraPermission}
        </div>
      )}
    </>
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
  cameraError: string | null
  onPhotoCountChange: (value: 2 | 3 | 4) => void
  onFrameColorChange: (value: string) => void
  onCountdownChange: (value: CountdownSeconds) => void
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
  cameraError,
  onPhotoCountChange,
  onFrameColorChange,
  onCountdownChange,
  onOpenCamera,
}: SetupPanelProps) {
  return (
    <section className="grid min-w-0 items-start gap-7 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] xl:gap-10">
      <div className="min-w-0 xl:sticky xl:top-24">
        <p className="mb-3 mt-0 text-xs font-semibold uppercase text-gf-muted">{t.preview}</p>
        <div
          className="flex h-[min(58vh,340px)] min-h-[260px] min-w-0 items-center justify-center overflow-hidden bg-gf-pink-100/40 px-4 py-5 sm:h-[420px] sm:px-7 sm:py-7 xl:h-[min(62vh,520px)]"
          style={{ containerType: 'size' }}
        >
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
          {databaseFrame && databaseFrame.frameCount > 1 ? (
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

        <SettingSection icon={Timer} title={t.countdownTime} last={Boolean(databaseFrame)}>
          <CountdownStepper
            value={countdownSeconds}
            onChange={onCountdownChange}
            secondsLabel={t.seconds}
            decreaseLabel={t.decreaseCountdown}
            increaseLabel={t.increaseCountdown}
          />
        </SettingSection>

        {!databaseFrame && (
          <SettingSection icon={Sparkles} title={t.frameColor} last>
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
  const frameRatio = frame.canvasWidth / frame.canvasHeight

  return (
    <div
      className="relative shrink-0 overflow-hidden shadow-[0_14px_34px_rgba(76,54,48,0.16)]"
      style={{
        aspectRatio: `${frame.canvasWidth}/${frame.canvasHeight}`,
        width: `min(100%, calc(100cqh * ${frameRatio}))`,
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
