'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, FileImage, ShieldCheck, Upload, X } from 'lucide-react'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { getPageText } from '@/lib/menuI18n'
import { identityVerificationService } from '@/services/identityVerification'
import { useAppStore } from '@/store/appStore'
import { useToast } from '@/hooks/useToast'
import type {
  IdentityVerificationData,
  IdentityVerificationStatus,
} from '@/types/identityVerification'
import { AccountTabs } from '../AccountTabs'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function AccountVerifyPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<IdentityVerificationStatus>('not_submitted')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const locale = useAppStore((state) => state.locale)
  const setUser = useAppStore((state) => state.setUser)
  const { showToast } = useToast()
  const accountText = getPageText(locale, 'account')
  const t = getPageText(locale, 'verifyUpload')

  useEffect(() => {
    let active = true
    void identityVerificationService.get().then((result) => {
      if (!active) return
      if (result.success) {
        setStatus(result.data.status)
        setRejectionReason(result.data.rejectionReason)
        setUser({ idVerified: result.data.verified })
      } else {
        showToast(t.loadFailed)
      }
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [setUser, showToast, t.loadFailed])

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  function selectFile(selectedFile?: File) {
    if (!selectedFile) return
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      showToast(t.invalidType)
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      showToast(t.fileTooLarge)
      return
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const objectUrl = URL.createObjectURL(selectedFile)
    previewUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setFile(selectedFile)
  }

  function clearFile() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    if (inputRef.current) inputRef.current.value = ''
    setPreviewUrl('')
    setFile(null)
  }

  async function handleSubmit() {
    if (!file) {
      showToast(t.fileRequired)
      return
    }

    setSubmitting(true)
    const result = await identityVerificationService.upload(file)
    setSubmitting(false)
    if (!result.success) {
      showToast(result.error || t.uploadFailed)
      return
    }

    applyVerification(result.data)
    clearFile()
    showToast(t.submittedToast)
  }

  function applyVerification(data: IdentityVerificationData) {
    setStatus(data.status)
    setRejectionReason(data.rejectionReason)
    setUser({ idVerified: data.verified })
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[accountText.myAccount, t.verify]} />
      <AccountTabs active="verify" />

      <section className="rounded-[22px] bg-white p-5 [box-shadow:var(--gf-shadow)] sm:p-7">
        <div className="mb-6">
          <h1 className="m-0 text-[19px] font-bold text-gf-brown-900">{t.verify}</h1>
          <p className="mt-1 text-[13.5px] leading-6 text-gf-muted">{t.subtitle}</p>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-[14px] text-gf-muted">
            {t.loading}
          </div>
        ) : status === 'approved' ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center">
            <CheckCircle2 className="mb-5 text-gf-green" size={72} strokeWidth={1.5} />
            <h2 className="m-0 text-[20px] font-bold text-gf-brown-900">{t.verified}</h2>
            <p className="mt-2 max-w-[440px] text-[13.5px] leading-6 text-gf-muted">
              {t.verifiedDescription}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#DFF2E0] px-4 py-2 text-[13px] font-semibold text-gf-green">
              <ShieldCheck size={16} />
              {t.verified}
            </div>
          </div>
        ) : status === 'pending' ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center">
            <Clock3 className="mb-5 text-gf-yellow" size={72} strokeWidth={1.5} />
            <h2 className="m-0 text-[20px] font-bold text-gf-brown-900">{t.pending}</h2>
            <p className="mt-2 max-w-[460px] text-[13.5px] leading-6 text-gf-muted">
              {t.pendingDescription}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FFF3CD] px-4 py-2 text-[13px] font-semibold text-gf-brown-800">
              <Clock3 size={16} />
              {t.pending}
            </div>
          </div>
        ) : (
          <>
            {status === 'rejected' ? (
              <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-gf-red bg-[#FFF1F1] p-4 text-[13px] leading-6 text-gf-brown-800">
                <AlertCircle className="mt-0.5 shrink-0 text-gf-red" size={20} />
                <div>
                  <strong className="block text-gf-brown-900">{t.rejected}</strong>
                  <span>{rejectionReason || t.rejectedDescription}</span>
                </div>
              </div>
            ) : null}

            <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-gf-yellow bg-[#FFF9E8] p-4 text-[13px] leading-6 text-gf-brown-800">
              <ShieldCheck className="mt-0.5 shrink-0 text-gf-brown-700" size={20} />
              <div>
                <strong className="block text-gf-brown-900">{t.privacyTitle}</strong>
                {t.notice}
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />

            {previewUrl && file ? (
              <div className="mb-5 overflow-hidden rounded-[8px] border border-gf-brown-200">
                <div className="flex items-center justify-between gap-3 border-b border-gf-brown-200 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-gf-brown-900">
                    <FileImage className="shrink-0" size={18} />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    title={t.removeFile}
                    aria-label={t.removeFile}
                    onClick={clearFile}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-gf-muted hover:bg-gf-pink-100 hover:text-gf-brown-900"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="relative mx-auto aspect-[1.586/1] w-full max-w-[620px] bg-gf-pink-100">
                  <Image
                    src={previewUrl}
                    alt={t.previewAlt}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mb-5 flex min-h-[190px] w-full flex-col items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-gf-brown-300 bg-white px-5 text-center text-gf-muted transition-colors hover:border-gf-brown-700 hover:bg-gf-pink-100"
              >
                <Upload size={28} className="text-gf-brown-700" />
                <span className="text-[14px] font-semibold text-gf-brown-900">{t.uploadLabel}</span>
                <span className="text-[12.5px]">{t.fileHint}</span>
              </button>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {file ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => inputRef.current?.click()}
                  className="min-h-11 rounded-full border border-gf-brown-300 bg-white px-6 text-[14px] font-semibold text-gf-brown-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t.changeFile}
                </button>
              ) : null}
              <button
                type="button"
                disabled={!file || submitting}
                onClick={handleSubmit}
                className="min-h-11 rounded-full border-0 bg-gf-brown-800 px-6 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? t.uploading : t.confirm}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
