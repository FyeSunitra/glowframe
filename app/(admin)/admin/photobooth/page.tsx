'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Plus, Trash2, Upload } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { Pagination } from '@/components/common/Pagination'
import {
  detectPhotoboothFrame,
  type DetectedPhotoboothFrame,
} from '@/components/features/photobooth/frameDetection'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { adminPhotoboothFrameText } from '@/lib/menuI18n'
import { cn } from '@/lib/utils'
import { adminPhotoboothService } from '@/services/photobooth'
import { useAppStore } from '@/store/appStore'
import type { PhotoboothFrame } from '@/types/photobooth'

const MAX_FILE_BYTES = 15 * 1024 * 1024

export default function AdminPhotoboothPage() {
  const locale = useAppStore((state) => state.locale)
  const t = adminPhotoboothFrameText[locale]
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PhotoboothFrame | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PhotoboothFrame | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin', 'photobooth-frames', page, limit],
    queryFn: async () =>
      unwrapApiResponse(await adminPhotoboothService.list({ page, limit })),
  })
  const frames = result?.items ?? []
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'photobooth-frames'] })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminPhotoboothService.update(id, { active }).then(unwrapApiResponse),
    onSuccess: (_, input) => {
      void invalidate()
      showToast(input.active ? t.activated : t.deactivated)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      adminPhotoboothService.remove(id).then(unwrapApiResponse),
    onSuccess: () => {
      if (frames.length === 1 && page > 1) setPage((current) => current - 1)
      void invalidate()
      showToast(t.deleted)
    },
  })

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', t.breadcrumb]}
        title={t.title}
        action={
          <Button
            onClick={() => {
              setEditTarget(null)
              setFormOpen(true)
            }}
          >
            <Plus />
            {t.add}
          </Button>
        }
      />
      <p className="mb-5 -mt-3 text-sm text-gf-muted">{t.subtitle}</p>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-gf-muted">{t.loading}</div>
      ) : frames.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[8px] border border-dashed border-gf-brown-300 bg-white p-8 text-center">
          <ImagePlus size={34} className="mb-3 text-gf-brown-500" />
          <h2 className="m-0 text-lg font-semibold text-gf-brown-900">{t.empty}</h2>
          <p className="mb-0 mt-1 text-sm text-gf-muted">{t.emptySub}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {frames.map((frame) => (
            <article
              key={frame.id}
              className="overflow-hidden rounded-[8px] border border-gf-line bg-white"
            >
              <FrameVisual frame={frame} compact />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="m-0 truncate text-base font-semibold text-gf-brown-900">
                      {locale === 'th' ? frame.nameTh : frame.nameEn}
                    </h2>
                    <p className="mb-0 mt-1 text-xs text-gf-muted">
                      {frame.canvasWidth}×{frame.canvasHeight} · {frame.aspectRatioLabel} ·{' '}
                      {frame.frameCount} {t.slots}
                    </p>
                    <p className="mb-0 mt-1 text-sm font-semibold text-gf-brown-800">
                      {frame.price && frame.price > 0
                        ? formatFramePrice(frame.price, locale)
                        : t.free}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleMutation.mutate({ id: frame.id, active: !frame.active })
                    }
                    className={cn(
                      'shrink-0 cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-semibold',
                      frame.active ? 'bg-gf-green text-white' : 'bg-gf-line text-gf-muted',
                    )}
                  >
                    {frame.active ? t.active : t.inactive}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTarget(frame)
                      setFormOpen(true)
                    }}
                    className="flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-gf-line bg-white text-sm font-medium text-gf-brown-800 transition-colors hover:bg-gf-pink-100"
                  >
                    <Pencil size={16} />
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(frame)}
                    className="flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-gf-line bg-white text-sm font-medium text-gf-red transition-colors hover:bg-gf-red/5"
                  >
                    <Trash2 size={16} />
                    {t.confirmDelete}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        limit={limit}
        total={result?.meta.total ?? 0}
        totalPages={result?.meta.totalPages ?? 1}
        onPageChange={setPage}
        onLimitChange={(value) => {
          setLimit(value)
          setPage(1)
        }}
      />

      {formOpen && (
        <CreateFrameDialog
          key={editTarget?.id ?? 'create'}
          open
          frame={editTarget}
          onOpenChange={(next) => {
            setFormOpen(next)
            if (!next) setEditTarget(null)
          }}
          onSaved={() => void invalidate()}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null)
        }}
        title={t.deleteTitle}
        description={t.deleteDescription}
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

function CreateFrameDialog({
  open,
  frame,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  frame: PhotoboothFrame | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const locale = useAppStore((state) => state.locale)
  const t = adminPhotoboothFrameText[locale]
  const { showToast } = useToast()
  const [nameTh, setNameTh] = useState(frame?.nameTh ?? '')
  const [nameEn, setNameEn] = useState(frame?.nameEn ?? '')
  const [descriptionTh, setDescriptionTh] = useState(frame?.descriptionTh ?? '')
  const [descriptionEn, setDescriptionEn] = useState(frame?.descriptionEn ?? '')
  const [price, setPrice] = useState(
    frame?.price && frame.price > 0 ? String(frame.price) : '',
  )
  const [sortOrder, setSortOrder] = useState(frame?.sortOrder ?? 0)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(frame?.overlayUrl ?? null)
  const [detected, setDetected] = useState<DetectedPhotoboothFrame | null>(() =>
    frame
      ? {
          canvasWidth: frame.canvasWidth,
          canvasHeight: frame.canvasHeight,
          aspectRatioLabel: frame.aspectRatioLabel ?? 'Custom',
          slots: frame.slots,
        }
      : null,
  )
  const [detecting, setDetecting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditing = Boolean(frame)

  useEffect(
    () => () => {
      revokeObjectPreview(previewUrl)
    },
    [previewUrl],
  )

  const createMutation = useMutation({
    mutationFn: async () => {
      if ((!frame && !file) || !detected || !nameTh.trim() || !nameEn.trim()) {
        throw new Error(t.required)
      }
      const input = {
        nameTh: nameTh.trim(),
        nameEn: nameEn.trim(),
        descriptionTh: descriptionTh.trim() || null,
        descriptionEn: descriptionEn.trim() || null,
        canvasWidth: detected.canvasWidth,
        canvasHeight: detected.canvasHeight,
        aspectRatioLabel: detected.aspectRatioLabel,
        slots: detected.slots,
        originalFileName: file?.name ?? frame?.originalFileName,
        price: price.trim() ? Number(price) : 0,
        active: frame?.active ?? true,
        sortOrder,
      }
      if (frame) {
        return unwrapApiResponse(
          await adminPhotoboothService.update(
            frame.id,
            input,
            file ?? undefined,
            frame.overlayPublicId,
          ),
        )
      }
      return unwrapApiResponse(await adminPhotoboothService.create(input, file as File))
    },
    onSuccess: () => {
      showToast(frame ? t.updated : t.saved)
      onSaved()
      reset()
      onOpenChange(false)
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : t.detectFailed),
  })

  async function selectFile(nextFile?: File) {
    if (!nextFile || nextFile.type !== 'image/png' || nextFile.size > MAX_FILE_BYTES) {
      showToast(t.invalidFile)
      return
    }
    revokeObjectPreview(previewUrl)
    setFile(nextFile)
    setPreviewUrl(URL.createObjectURL(nextFile))
    setDetected(null)
    setDetecting(true)
    try {
      setDetected(await detectPhotoboothFrame(nextFile))
    } catch (error) {
      showToast(error instanceof Error ? error.message : t.detectFailed)
    } finally {
      setDetecting(false)
    }
  }

  function reset() {
    revokeObjectPreview(previewUrl)
    setNameTh('')
    setNameEn('')
    setDescriptionTh('')
    setDescriptionEn('')
    setPrice('')
    setSortOrder(0)
    setFile(null)
    setPreviewUrl(null)
    setDetected(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const parsedPrice = price.trim() ? Number(price) : 0
  const priceIsValid = Number.isFinite(parsedPrice) && parsedPrice >= 0 && parsedPrice <= 99999999.99
  const canSave = Boolean(
    nameTh.trim() && nameEn.trim() && (frame || file) && detected && !detecting && priceIsValid,
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-none overflow-y-auto p-0 sm:w-[calc(100vw-48px)] sm:max-w-none lg:w-[min(1180px,calc(100vw-80px))] lg:max-w-[1180px]">
        <DialogHeader className="border-b border-gf-line px-6 py-5">
          <DialogTitle>{isEditing ? t.editTitle : t.addTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(360px,0.9fr)_minmax(460px,1.1fr)]">
          <div className="space-y-4">
            <Field label={t.nameTh}>
              <Input value={nameTh} onChange={(event) => setNameTh(event.target.value)} />
            </Field>
            <Field label={t.nameEn}>
              <Input value={nameEn} onChange={(event) => setNameEn(event.target.value)} />
            </Field>
            <Field label={t.descriptionTh}>
              <Textarea value={descriptionTh} onChange={(event) => setDescriptionTh(event.target.value)} />
            </Field>
            <Field label={t.descriptionEn}>
              <Textarea value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} />
            </Field>
            <Field label={t.price}>
              <Input
                type="number"
                min={0}
                max={99999999.99}
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
              />
              <p className="mb-0 mt-1.5 text-xs text-gf-muted">{t.priceHint}</p>
            </Field>
            <Field label={t.sortOrder}>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(event) => setSortOrder(Number(event.target.value) || 0)}
              />
            </Field>
            <div>
              <Label>{t.pngFile}</Label>
              <p className="mb-3 mt-1 text-xs leading-5 text-gf-muted">{t.pngHint}</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/png"
                className="sr-only"
                onChange={(event) => void selectFile(event.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload />
                {t.chooseFile}
              </Button>
              {(file || frame?.originalFileName) && (
                <span className="ml-3 text-xs text-gf-muted">
                  {file?.name ?? frame?.originalFileName}
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 mt-0 text-sm font-semibold text-gf-brown-900">{t.preview}</h3>
            {previewUrl && detected ? (
              <FrameVisual
                frame={{
                  overlayUrl: previewUrl,
                  canvasWidth: detected.canvasWidth,
                  canvasHeight: detected.canvasHeight,
                  slots: detected.slots,
                }}
              />
            ) : (
              <div className="flex min-h-80 items-center justify-center rounded-[8px] border border-dashed border-gf-brown-300 bg-gf-pink-100/30 text-sm text-gf-muted">
                {detecting ? t.detecting : t.chooseFile}
              </div>
            )}
            {detected && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Info label={t.detected} value={`${detected.slots.length} ${t.slots}`} />
                <Info
                  label={t.dimensions}
                  value={`${detected.canvasWidth}×${detected.canvasHeight}`}
                />
                <Info label={t.ratio} value={detected.aspectRatioLabel} />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gf-line px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button
            disabled={!canSave || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending
              ? t.saving
              : isEditing
                ? t.saveChanges
                : t.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FrameVisual({
  frame,
  compact = false,
}: {
  frame: Pick<PhotoboothFrame, 'overlayUrl' | 'canvasWidth' | 'canvasHeight' | 'slots'>
  compact?: boolean
}) {
  const landscape = frame.canvasWidth >= frame.canvasHeight
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-4',
        compact ? 'h-64' : 'min-h-80 rounded-[8px]',
      )}
    >
      <div
        className="relative max-h-full max-w-full"
        style={{
          aspectRatio: `${frame.canvasWidth}/${frame.canvasHeight}`,
          width: landscape ? '100%' : compact ? '150px' : '260px',
        }}
      >
        <Image
          src={frame.overlayUrl}
          alt="Photobooth frame preview"
          fill
          unoptimized
          className="object-contain"
        />
        {frame.slots.map((slot, index) => (
          <span
            key={index}
            className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gf-brown-800 text-xs font-bold text-white shadow"
            style={{
              left: `${(slot.x + slot.width / 2) * 100}%`,
              top: `${(slot.y + slot.height / 2) * 100}%`,
            }}
          >
            {index + 1}
          </span>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-gf-pink-100 p-2">
      <span className="block text-gf-muted">{label}</span>
      <b className="mt-0.5 block text-gf-brown-900">{value}</b>
    </div>
  )
}

function formatFramePrice(price: number, locale: 'th' | 'en') {
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(price)
}

function revokeObjectPreview(url: string | null) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}
