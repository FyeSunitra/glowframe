'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Video,
} from 'lucide-react'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { publicMasterDataService } from '@/services/masterData'
import { useAppStore } from '@/store/appStore'
import { useToast } from '@/hooks/useToast'
import { cn, productColor } from '@/lib/utils'
import type { Product } from '@/types'
import type { Accessory, Brand, Category } from '@/types/masterData'
import { getPageText } from '@/lib/menuI18n'

type FormStep = 1 | 2

interface SelectedImage {
  id: string
  file: File
  previewUrl: string
}

export default function AddProductPage() {
  const router = useRouter()
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'listing')
  const { showToast } = useToast()
  const {
    form,
    setAddProduct,
    resetAddProduct,
    addMyListing,
    addresses,
    user,
  } = useAppStore((state) => ({
    form: state.addProduct,
    setAddProduct: state.setAddProduct,
    resetAddProduct: state.resetAddProduct,
    addMyListing: state.addMyListing,
    addresses: state.addresses,
    user: state.user,
  }))

  const [step, setStep] = useState<FormStep>(1)
  const [processing, setProcessing] = useState(false)
  const [images, setImages] = useState<SelectedImage[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const previewUrls = useRef(new Set<string>())

  const categoriesQuery = useQuery({
    queryKey: ['public', 'master', 'categories', 'listing-form'],
    queryFn: () => loadMasterItems(publicMasterDataService.categories.list({ limit: 100 })),
  })
  const brandsQuery = useQuery({
    queryKey: ['public', 'master', 'brands', 'listing-form'],
    queryFn: () => loadMasterItems(publicMasterDataService.brands.list({ limit: 100 })),
  })
  const accessoriesQuery = useQuery({
    queryKey: ['public', 'master', 'accessories', 'listing-form'],
    queryFn: () => loadMasterItems(publicMasterDataService.accessories.list({ limit: 100 })),
  })

  const categories = (categoriesQuery.data ?? []) as Category[]
  const brands = (brandsQuery.data ?? []) as Brand[]
  const accessories = (accessoriesQuery.data ?? []) as Accessory[]
  const masterDataFailed =
    categoriesQuery.isError || brandsQuery.isError || accessoriesQuery.isError

  useEffect(() => {
    const urls = previewUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  function verifyOwner() {
    if (!user.idVerified || user.suspended) {
      showToast(t.identityRequired)
      return false
    }
    return true
  }

  function goToRentalOptions() {
    if (!verifyOwner()) return
    if (
      !form.title.trim() ||
      !form.categoryId ||
      !form.brandId ||
      !form.model.trim()
    ) {
      showToast(t.requiredInformation)
      return
    }
    if (images.length === 0) {
      showToast(t.imageRequired)
      return
    }
    setStep(2)
  }

  function submit() {
    if (!verifyOwner()) return
    const price = Number(form.pricePerDay)
    const deposit = Number(form.depositAmount)
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(deposit) || deposit < 0) {
      showToast(t.priceRequired)
      return
    }
    if (!form.pickupAddressId) {
      showToast(t.addressRequired)
      return
    }

    setProcessing(true)
    const id = Date.now()
    const newProduct: Product = {
      id,
      name: form.title,
      desc: form.description || t.noDescription,
      price: Number(form.pricePerDay),
      deposit: Number(form.depositAmount),
      color: productColor(id),
      rating: 5,
      status: 'pending',
    }
    addMyListing(newProduct)
    resetAddProduct()
    window.setTimeout(() => {
      router.push('/list-camera/add/success')
    }, 1200)
  }

  function addImages(files: FileList | null) {
    if (!files) return
    const availableSlots = Math.max(0, 8 - images.length)
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, availableSlots)
      .map((file) => {
        const previewUrl = URL.createObjectURL(file)
        previewUrls.current.add(previewUrl)
        return {
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          previewUrl,
        }
      })

    setImages((current) => [...current, ...selected])
    if (selected.length > 0) showToast(t.imageSelected)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function removeImage(image: SelectedImage) {
    URL.revokeObjectURL(image.previewUrl)
    previewUrls.current.delete(image.previewUrl)
    setImages((current) => current.filter((item) => item.id !== image.id))
  }

  function toggleAccessory(accessoryId: number) {
    const selected = form.accessories.some((item) => item.accessoryId === accessoryId)
    setAddProduct({
      accessories: selected
        ? form.accessories.filter((item) => item.accessoryId !== accessoryId)
        : [...form.accessories, { accessoryId, quantity: 1 }],
    })
  }

  function updateAccessoryQuantity(accessoryId: number, quantity: number) {
    setAddProduct({
      accessories: form.accessories.map((item) =>
        item.accessoryId === accessoryId
          ? { ...item, quantity: Math.min(99, Math.max(1, quantity)) }
          : item,
      ),
    })
  }

  if (processing) {
    return (
      <div className="animate-fade-up">
        <Breadcrumb items={[t.home, t.listCamera, t.addProduct]} />
        <div className="rounded-[22px] bg-white px-5 py-[50px] text-center shadow-[var(--gf-shadow)]">
          <div className="mx-auto mb-[22px] flex h-[82px] w-[82px] items-center justify-center rounded-full bg-gf-pink-100 text-gf-yellow">
            <ShieldCheck size={42} />
          </div>
          <h2 className="m-0 mb-2.5 text-xl font-bold text-gf-brown-900">
            {t.receivedTitle}
          </h2>
          <p className="mx-auto max-w-[420px] text-[13.5px] leading-7 text-gf-muted">
            {t.receivedDescription}
          </p>
          <div className="mt-[26px]">
            <span className="rounded-full bg-gf-pink-100 px-4 py-2 text-[13px] font-semibold text-gf-brown-800">
              {t.processing}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { value: 1 as const, label: t.stepBasic },
    { value: 2 as const, label: t.stepRental },
  ]

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.home, t.listCamera, t.addProduct]} />

      <StepIndicator steps={steps} currentStep={step} onSelect={setStep} />

      {(!user.idVerified || user.suspended) && (
        <div className="mb-5 flex items-center gap-3 rounded-[18px] bg-gf-pink-100 p-[18px] shadow-[var(--gf-shadow-sm)]">
          <ShieldCheck size={22} className="shrink-0 text-gf-brown-700" />
          <div className="flex-1 text-[13.5px] leading-6 text-gf-brown-700">
            {t.identityRequired}
          </div>
          <button
            type="button"
            onClick={() => router.push('/account/verify')}
            className={OUTLINE_BTN_CLASS}
          >
            {t.verifyNow}
          </button>
        </div>
      )}

      {masterDataFailed && (
        <div className="mb-5 rounded-[14px] border border-gf-red bg-[#FAE0DA] px-4 py-3 text-sm font-medium text-gf-red">
          {t.masterDataError}
        </div>
      )}

      {step === 1 && (
        <section className={SECTION_CLASS}>
          <SectionHeading title={t.basicInformation} description={t.basicInformationSub} />

          <div className="grid grid-cols-2 gap-x-4 max-[760px]:grid-cols-1">
            <Field label={t.category} required>
              <Select
                value={form.categoryId?.toString() ?? ''}
                onValueChange={(value) =>
                  setAddProduct({ categoryId: value ? Number(value) : null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.chooseCategory} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t.brand} required>
              <Select
                value={form.brandId?.toString() ?? ''}
                onValueChange={(value) =>
                  setAddProduct({ brandId: value ? Number(value) : null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.chooseBrand} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t.productName} required>
              <input
                className={INPUT_CLASS}
                maxLength={160}
                placeholder={t.productNamePlaceholder}
                value={form.title}
                onChange={(event) => setAddProduct({ title: event.target.value })}
              />
            </Field>

            <Field label={t.model} required>
              <input
                className={INPUT_CLASS}
                maxLength={160}
                placeholder={t.modelPlaceholder}
                value={form.model}
                onChange={(event) => setAddProduct({ model: event.target.value })}
              />
            </Field>
          </div>

          <Field label={t.serialNumber} hint={t.serialNumberOptional}>
            <input
              className={INPUT_CLASS}
              maxLength={160}
              placeholder={t.serialNumberPlaceholder}
              value={form.serialNumber}
              onChange={(event) => setAddProduct({ serialNumber: event.target.value })}
            />
          </Field>

          <Field label={t.productDescription}>
            <textarea
              placeholder={t.productDescriptionPlaceholder}
              value={form.description}
              onChange={(event) => setAddProduct({ description: event.target.value })}
              className={cn(INPUT_CLASS, 'min-h-[104px] resize-y')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-x-4 max-[760px]:grid-cols-1">
            <Field label={t.conditionNote}>
              <textarea
                placeholder={t.conditionNotePlaceholder}
                value={form.conditionNote}
                onChange={(event) => setAddProduct({ conditionNote: event.target.value })}
                className={cn(INPUT_CLASS, 'min-h-[96px] resize-y')}
              />
            </Field>
            <Field label={t.extra}>
              <textarea
                placeholder={t.extraPlaceholder}
                value={form.extraDetails}
                onChange={(event) => setAddProduct({ extraDetails: event.target.value })}
                className={cn(INPUT_CLASS, 'min-h-[96px] resize-y')}
              />
            </Field>
          </div>

          <div className="my-6 h-px bg-gf-line" />
          <SectionHeading title={t.mediaTitle} description={t.mediaSub} />

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(event) => addImages(event.target.files)}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setVideoFile(file)
              if (file) showToast(t.videoSelected)
            }}
          />

          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(220px,0.6fr)] gap-4 max-[760px]:grid-cols-1">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={cn(
                UPLOAD_BOX_CLASS,
                'relative min-h-[220px] overflow-hidden',
                images.length > 0 && 'border-solid p-0',
              )}
            >
              {images[0] ? (
                <>
                  <Image
                    src={images[0].previewUrl}
                    alt={form.title || t.mainImage}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gf-brown-900">
                    {t.mainImage}
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus size={27} />
                  <span className="font-semibold">{t.addImage}</span>
                  <span className="text-xs font-normal">{t.imageHint}</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className={cn(
                  UPLOAD_BOX_CLASS,
                  'min-h-[160px] w-full',
                  videoFile && 'border-solid bg-white',
                )}
              >
                <Video size={25} />
                <span className="max-w-full truncate px-4 font-semibold">
                  {videoFile?.name ?? t.addVideo}
                </span>
                <span className="text-xs font-normal">{t.videoHint}</span>
              </button>
              {videoFile && (
                <button
                  type="button"
                  title={t.removeMedia}
                  aria-label={t.removeMedia}
                  onClick={() => {
                    setVideoFile(null)
                    if (videoInputRef.current) videoInputRef.current.value = ''
                  }}
                  className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-gf-pink-100 text-gf-red"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-5 gap-3 max-[900px]:grid-cols-4 max-[620px]:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-[12px] border border-gf-line bg-gf-pink-100"
                >
                  <Image
                    src={image.previewUrl}
                    alt={`${form.title || t.productName} ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    title={t.removeMedia}
                    aria-label={t.removeMedia}
                    onClick={() => removeImage(image)}
                    className="absolute right-1.5 top-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 text-gf-red shadow-sm"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={cn(UPLOAD_BOX_CLASS, 'aspect-square h-auto min-h-0')}
                >
                  <Plus size={20} />
                  <span className="px-2 text-center text-xs">{t.addMoreImages}</span>
                </button>
              )}
            </div>
          )}

          <div className="mt-7 flex justify-end">
            <button type="button" onClick={goToRentalOptions} className={DARK_BTN_CLASS}>
              {t.next}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className={SECTION_CLASS}>
          <SectionHeading title={t.rentalOptions} description={t.rentalOptionsSub} />

          <div className="grid grid-cols-2 gap-x-4 max-[760px]:grid-cols-1">
            <Field label={t.dailyPrice} required>
              <MoneyInput
                value={form.pricePerDay}
                onChange={(value) => setAddProduct({ pricePerDay: value })}
              />
            </Field>
            <Field label={t.deposit} required>
              <MoneyInput
                value={form.depositAmount}
                onChange={(value) => setAddProduct({ depositAmount: value })}
              />
            </Field>
          </div>

          <div className="my-6 h-px bg-gf-line" />
          <SectionHeading
            title={t.includedAccessories}
            description={t.includedAccessoriesSub}
          />

          {accessories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
              {accessories.map((accessory) => {
                const selected = form.accessories.find(
                  (item) => item.accessoryId === accessory.id,
                )
                return (
                  <div
                    key={accessory.id}
                    className={cn(
                      'flex min-h-[62px] items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-3 transition-colors',
                      selected
                        ? 'border-gf-brown-800 bg-gf-pink-100'
                        : 'border-gf-line bg-white',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selected)}
                      onChange={() => toggleAccessory(accessory.id)}
                      aria-label={accessory.name}
                      className="h-[17px] w-[17px] accent-gf-brown-800"
                    />
                    <button
                      type="button"
                      onClick={() => toggleAccessory(accessory.id)}
                      className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left text-sm font-semibold text-gf-brown-800"
                    >
                      {accessory.name}
                    </button>
                    {selected && (
                      <div className="flex h-9 shrink-0 items-center rounded-full border border-gf-brown-300 bg-white">
                        <QuantityButton
                          label={`- ${t.quantity}`}
                          onClick={() =>
                            updateAccessoryQuantity(accessory.id, selected.quantity - 1)
                          }
                        >
                          <Minus size={14} />
                        </QuantityButton>
                        <span className="w-8 text-center text-sm font-semibold">
                          {selected.quantity}
                        </span>
                        <QuantityButton
                          label={`+ ${t.quantity}`}
                          onClick={() =>
                            updateAccessoryQuantity(accessory.id, selected.quantity + 1)
                          }
                        >
                          <Plus size={14} />
                        </QuantityButton>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gf-muted">{t.noAccessories}</p>
          )}

          <div className="my-6 h-px bg-gf-line" />
          <SectionHeading title={t.deliveryAddress} description={t.deliveryAddressSub} />

          {addresses.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
              {addresses.map((address) => (
                <button
                  type="button"
                  key={address.id}
                  onClick={() => setAddProduct({ pickupAddressId: address.id })}
                  className={cn(
                    'flex min-h-[86px] cursor-pointer items-start gap-3 rounded-[14px] border-[1.5px] px-4 py-[15px] text-left',
                    form.pickupAddressId === address.id
                      ? 'border-gf-brown-800 bg-gf-pink-100'
                      : 'border-gf-line bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'relative mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-2',
                      form.pickupAddressId === address.id
                        ? 'border-gf-brown-800'
                        : 'border-gf-brown-300',
                    )}
                  >
                    {form.pickupAddressId === address.id && (
                      <span className="absolute inset-[3px] rounded-full bg-gf-brown-800" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-sm text-gf-brown-900">
                      {address.label}
                    </strong>
                    <span className="mt-1 block text-[13px] leading-5 text-gf-muted">
                      {address.detail}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/account/address')}
              className="flex min-h-[150px] w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-gf-brown-300 bg-gf-pink-100 text-[14.5px] font-semibold text-gf-muted"
            >
              <Plus size={18} />
              {t.addAddress}
            </button>
          )}

          {addresses.length > 0 && (
            <button
              type="button"
              onClick={() => router.push('/account/address')}
              className="mt-4 flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm font-semibold text-gf-brown-700"
            >
              <Plus size={16} />
              {t.addAddress}
            </button>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 max-[520px]:flex-col-reverse max-[520px]:items-stretch">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={OUTLINE_BTN_CLASS}
            >
              <ArrowLeft size={17} />
              {t.previous}
            </button>
            <button type="button" onClick={submit} className={DARK_BTN_CLASS}>
              <Send size={17} />
              {t.submit}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

async function loadMasterItems<T>(
  request: Promise<
    | { success: true; data: { items: T[] } }
    | { success: false; error: string }
  >,
) {
  const result = await request
  if (!result.success) throw new Error(result.error)
  return result.data.items
}

function StepIndicator({
  steps,
  currentStep,
  onSelect,
}: {
  steps: Array<{ value: FormStep; label: string }>
  currentStep: FormStep
  onSelect: (step: FormStep) => void
}) {
  return (
    <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-[14px] border border-gf-line bg-white">
      {steps.map((item) => {
        const completed = item.value < currentStep
        const active = item.value === currentStep
        return (
          <button
            type="button"
            key={item.value}
            onClick={() => {
              if (item.value < currentStep) onSelect(item.value)
            }}
            className={cn(
              'flex min-h-[54px] items-center justify-center gap-2 border-0 border-r border-gf-line px-3 text-sm font-semibold last:border-r-0 max-[620px]:flex-col max-[620px]:gap-1 max-[620px]:text-xs',
              completed && 'cursor-pointer bg-gf-pink-100 text-gf-brown-800',
              active && 'bg-gf-brown-800 text-gf-pink-100',
              !completed && !active && 'cursor-default bg-white text-gf-muted',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                active
                  ? 'border-gf-pink-100'
                  : completed
                    ? 'border-gf-brown-800'
                    : 'border-gf-line',
              )}
            >
              {completed ? <Check size={13} /> : item.value}
            </span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-5">
      <h1 className="m-0 mb-1.5 text-[19px] font-bold text-gf-brown-900">{title}</h1>
      <p className="m-0 text-[13.5px] leading-6 text-gf-muted">{description}</p>
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-[18px]">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <label className="text-[13.5px] font-semibold text-gf-brown-800">
          {label}
          {required && <span className="ml-1 text-gf-red">*</span>}
        </label>
        {hint && <span className="text-xs text-gf-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function MoneyInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(INPUT_CLASS, 'pr-[58px]')}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gf-muted">
        THB
      </span>
    </div>
  )
}

function QuantityButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-gf-brown-800 hover:bg-gf-pink-100"
    >
      {children}
    </button>
  )
}

const SECTION_CLASS =
  'rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)] max-[620px]:p-5'
const INPUT_CLASS =
  'w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none transition-colors focus:border-gf-pink-500'
const UPLOAD_BOX_CLASS =
  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-gf-brown-300 bg-gf-pink-100 text-[13px] text-gf-muted'
const DARK_BTN_CLASS =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-gf-brown-800 px-[26px] py-[13px] text-[15px] font-semibold text-gf-pink-100'
const OUTLINE_BTN_CLASS =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-800'
