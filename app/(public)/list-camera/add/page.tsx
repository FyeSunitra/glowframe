'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Minus,
  Plus,
  Search,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { publicMasterDataService } from '@/services/masterData'
import { productService } from '@/services/products'
import { addressService } from '@/services/address'
import { useAppStore } from '@/store/appStore'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Accessory, Brand, Category } from '@/types/masterData'
import { getPageText } from '@/lib/menuI18n'
import type { ProductMediaInput } from '@/types/product'

type FormStep = 1 | 2

interface SelectedImage {
  id: string
  file?: File
  previewUrl: string
  publicId?: string
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime'])

export default function AddProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = Number(searchParams.get('edit')) || null
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'listing')
  const { showToast } = useToast()
  const {
    form,
    setAddProduct,
    resetAddProduct,
    addresses,
    setAddresses,
    user,
  } = useAppStore((state) => ({
    form: state.addProduct,
    setAddProduct: state.setAddProduct,
    resetAddProduct: state.resetAddProduct,
    addresses: state.addresses,
    setAddresses: state.setAddresses,
    user: state.user,
  }))

  const [step, setStep] = useState<FormStep>(1)
  const [processing, setProcessing] = useState(false)
  const [images, setImages] = useState<SelectedImage[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [existingVideo, setExistingVideo] = useState<ProductMediaInput | null>(null)
  const [customBrandSelected, setCustomBrandSelected] = useState(
    Boolean(form.customBrandName && !form.brandId),
  )
  const [accessorySearch, setAccessorySearch] = useState('')
  const [customAccessoryName, setCustomAccessoryName] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const previewUrls = useRef(new Set<string>())
  const editLoaded = useRef(false)

  const editQuery = useQuery({
    queryKey: ['products', 'mine', editId],
    queryFn: async () => unwrapApiResponse(await productService.getMine(editId!)),
    enabled: Boolean(editId),
  })

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
  const addressesQuery = useQuery({
    queryKey: ['user', 'addresses', 'listing-form'],
    queryFn: async () => unwrapApiResponse(await addressService.list()),
  })

  const categories = (categoriesQuery.data ?? []) as Category[]
  const brands = (brandsQuery.data ?? []) as Brand[]
  const accessories = (accessoriesQuery.data ?? []) as Accessory[]
  const availableAddresses = addressesQuery.data ?? addresses
  const masterDataFailed =
    categoriesQuery.isError || brandsQuery.isError || accessoriesQuery.isError

  useEffect(() => {
    const urls = previewUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (addressesQuery.data) setAddresses(addressesQuery.data)
  }, [addressesQuery.data, setAddresses])

  useEffect(() => {
    const product = editQuery.data
    if (!editId || !product || editLoaded.current) return
    editLoaded.current = true
    setAddProduct({
      title: product.name,
      categoryId: product.category?.id ?? null,
      brandId: product.brand?.id ?? null,
      customBrandName: product.customBrandName ?? '',
      model: product.model ?? '',
      serialNumber: product.serialNumber ?? '',
      description: product.desc,
      conditionNote: product.conditionNote ?? '',
      extraDetails: product.extraDetails ?? '',
      pricePerDay: String(product.price),
      depositAmount: String(product.deposit),
      pickupAddressId: product.pickupAddressId ?? null,
      accessories: product.masterAccessories ?? [],
      customAccessories: (product.customAccessories ?? []).map((item) => ({
        ...item,
        clientId: crypto.randomUUID(),
      })),
    })
    setCustomBrandSelected(Boolean(product.customBrandName))
    setImages(
      (product.media ?? [])
        .filter((item) => item.mediaType === 'image')
        .map((item) => ({
          id: `existing-${item.id}`,
          previewUrl: item.url,
          publicId: item.publicId,
        })),
    )
    const video = product.media?.find((item) => item.mediaType === 'video')
    setExistingVideo(
      video?.publicId
        ? { mediaType: 'video', url: video.url, publicId: video.publicId }
        : null,
    )
  }, [editId, editQuery.data, setAddProduct])

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
      (!form.brandId && !form.customBrandName.trim()) ||
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

  async function submit() {
    if (!verifyOwner()) return
    if (
      !form.categoryId ||
      (!form.brandId && !form.customBrandName.trim())
    ) {
      showToast(t.requiredInformation)
      return
    }
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
    try {
      const data = {
          title: form.title,
          categoryId: form.categoryId,
          brandId: form.brandId,
          customBrandName: form.brandId ? null : form.customBrandName.trim(),
          model: form.model,
          serialNumber: form.serialNumber,
          description: form.description,
          conditionNote: form.conditionNote,
          extraDetails: form.extraDetails,
          pricePerDay: price,
          depositAmount: deposit,
          pickupAddressId: form.pickupAddressId,
          accessories: form.accessories,
          customAccessories: form.customAccessories.map(({ name, quantity }) => ({
            name,
            quantity,
          })),
        }
      const files = {
          images: images.flatMap((image) => image.file ? [image.file] : []),
          video: videoFile,
        }
      if (editId) {
        const retainedMedia: ProductMediaInput[] = [
          ...images.flatMap((image) =>
            image.publicId
              ? [{ mediaType: 'image' as const, url: image.previewUrl, publicId: image.publicId }]
              : [],
          ),
          ...(existingVideo ? [existingVideo] : []),
        ]
        unwrapApiResponse(
          await productService.updateMine(editId, data, retainedMedia, files),
        )
      } else {
        unwrapApiResponse(await productService.create(data, files))
      }
      resetAddProduct()
      router.push(editId ? '/list-camera' : '/list-camera/add/success')
    } catch {
      setProcessing(false)
      showToast(t.submitFailed)
    }
  }

  function addImages(files: FileList | null) {
    if (!files) return
    const availableSlots = Math.max(0, 8 - images.length)
    const suppliedFiles = Array.from(files)
    const invalidFile = suppliedFiles.some(
      (file) =>
        !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES,
    )
    const selected = suppliedFiles
      .filter(
        (file) =>
          ALLOWED_IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_BYTES,
      )
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
    if (invalidFile) showToast(t.imageFileInvalid)
    if (selected.length > 0) showToast(t.imageSelected)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function removeImage(image: SelectedImage) {
    if (image.file) {
      URL.revokeObjectURL(image.previewUrl)
      previewUrls.current.delete(image.previewUrl)
    }
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

  function addCustomAccessory() {
    const name = customAccessoryName.trim()
    if (!name) return

    const normalizedName = name.toLocaleLowerCase()
    const duplicate =
      form.customAccessories.some(
        (item) => item.name.toLocaleLowerCase() === normalizedName,
      ) ||
      accessories.some(
        (item) => item.name.toLocaleLowerCase() === normalizedName,
      )

    if (duplicate) {
      showToast(t.customAccessoryDuplicate)
      return
    }

    setAddProduct({
      customAccessories: [
        ...form.customAccessories,
        {
          clientId: crypto.randomUUID(),
          name,
          quantity: 1,
        },
      ],
    })
    setCustomAccessoryName('')
    showToast(t.customAccessoryAdded)
  }

  function updateCustomAccessoryQuantity(clientId: string, quantity: number) {
    setAddProduct({
      customAccessories: form.customAccessories.map((item) =>
        item.clientId === clientId
          ? { ...item, quantity: Math.min(99, Math.max(1, quantity)) }
          : item,
      ),
    })
  }

  const filteredAccessories = accessories.filter((accessory) =>
    accessory.name.toLocaleLowerCase().includes(accessorySearch.trim().toLocaleLowerCase()),
  )
  const selectedMasterAccessories = form.accessories.flatMap((selected) => {
    const accessory = accessories.find((item) => item.id === selected.accessoryId)
    return accessory ? [{ ...selected, name: accessory.name }] : []
  })

  if (editId && editQuery.isLoading) {
    return <div className="py-16 text-center text-sm text-gf-muted">{t.loadingProducts}</div>
  }

  if (editId && editQuery.isError) {
    return <div className="py-16 text-center text-sm text-gf-red">{t.loadProductsFailed}</div>
  }

  if (processing) {
    return (
      <div className="animate-fade-up">
        <Breadcrumb items={[t.home, t.listCamera, editId ? t.editProduct : t.addProduct]} />
        <div className="rounded-[22px] bg-white px-5 py-[50px] text-center shadow-[var(--gf-shadow)]">
          <div className="mx-auto mb-[22px] flex h-[82px] w-[82px] items-center justify-center rounded-full bg-gf-pink-100 text-gf-yellow">
            <ShieldCheck size={42} />
          </div>
          <h2 className="m-0 mb-2.5 text-xl font-bold text-gf-brown-900">
            {editId ? t.updatingProduct : t.receivedTitle}
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
      <Breadcrumb items={[t.home, t.listCamera, editId ? t.editProduct : t.addProduct]} />

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
                value={
                  form.brandId?.toString() ??
                  (customBrandSelected ? 'other' : '')
                }
                onValueChange={(value) => {
                  if (value === 'other') {
                    setCustomBrandSelected(true)
                    setAddProduct({ brandId: null })
                    return
                  }

                  setCustomBrandSelected(false)
                  setAddProduct({
                    brandId: value ? Number(value) : null,
                    customBrandName: '',
                  })
                }}
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
                  <SelectItem value="other">{t.otherBrand}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {customBrandSelected && (
              <Field label={t.customBrand} required>
                <Input
                  maxLength={120}
                  placeholder={t.customBrandPlaceholder}
                  value={form.customBrandName}
                  onChange={(event) =>
                    setAddProduct({ customBrandName: event.target.value })
                  }
                />
              </Field>
            )}

            <Field label={t.productName} required>
              <Input
                maxLength={160}
                placeholder={t.productNamePlaceholder}
                value={form.title}
                onChange={(event) => setAddProduct({ title: event.target.value })}
              />
            </Field>

            <Field label={t.model} required>
              <Input
                maxLength={160}
                placeholder={t.modelPlaceholder}
                value={form.model}
                onChange={(event) => setAddProduct({ model: event.target.value })}
              />
            </Field>
          </div>

          <Field label={t.serialNumber} hint={t.serialNumberOptional}>
            <Input
              maxLength={160}
              placeholder={t.serialNumberPlaceholder}
              value={form.serialNumber}
              onChange={(event) => setAddProduct({ serialNumber: event.target.value })}
            />
          </Field>

          <Field label={t.productDescription}>
            <Textarea
              placeholder={t.productDescriptionPlaceholder}
              value={form.description}
              onChange={(event) => setAddProduct({ description: event.target.value })}
              className="min-h-[104px] resize-y"
            />
          </Field>

          <div className="grid grid-cols-2 gap-x-4 max-[760px]:grid-cols-1">
            <Field label={t.conditionNote}>
              <Textarea
                placeholder={t.conditionNotePlaceholder}
                value={form.conditionNote}
                onChange={(event) => setAddProduct({ conditionNote: event.target.value })}
                className="min-h-[96px] resize-y"
              />
            </Field>
            <Field label={t.extra}>
              <Textarea
                placeholder={t.extraPlaceholder}
                value={form.extraDetails}
                onChange={(event) => setAddProduct({ extraDetails: event.target.value })}
                className="min-h-[96px] resize-y"
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
              if (
                file &&
                (!ALLOWED_VIDEO_TYPES.has(file.type) ||
                  file.size > MAX_VIDEO_BYTES)
              ) {
                setVideoFile(null)
                event.target.value = ''
                showToast(t.videoFileInvalid)
                return
              }
              if (file) setExistingVideo(null)
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
                  (videoFile || existingVideo) && 'border-solid bg-white',
                )}
              >
                <Video size={25} />
                <span className="max-w-full truncate px-4 font-semibold">
                  {videoFile?.name ?? (existingVideo ? t.currentVideo : t.addVideo)}
                </span>
                <span className="text-xs font-normal">{t.videoHint}</span>
              </button>
              {(videoFile || existingVideo) && (
                <button
                  type="button"
                  title={t.removeMedia}
                  aria-label={t.removeMedia}
                  onClick={() => {
                    setVideoFile(null)
                    setExistingVideo(null)
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

          {(selectedMasterAccessories.length > 0 ||
            form.customAccessories.length > 0) && (
            <div className="mb-5">
              <div className="mb-2 text-xs font-semibold text-gf-muted">
                {t.selectedAccessories} (
                {selectedMasterAccessories.length + form.customAccessories.length})
              </div>
              <div className="divide-y divide-gf-line rounded-[8px] border border-gf-line bg-white">
                {selectedMasterAccessories.map((item) => (
                  <SelectedAccessoryRow
                    key={`master-${item.accessoryId}`}
                    name={item.name}
                    quantity={item.quantity}
                    quantityLabel={t.quantity}
                    onDecrease={() =>
                      updateAccessoryQuantity(item.accessoryId, item.quantity - 1)
                    }
                    onIncrease={() =>
                      updateAccessoryQuantity(item.accessoryId, item.quantity + 1)
                    }
                    onRemove={() => toggleAccessory(item.accessoryId)}
                    removeLabel={t.removeMedia}
                  />
                ))}
                {form.customAccessories.map((item) => (
                  <SelectedAccessoryRow
                    key={item.clientId}
                    name={item.name}
                    badge={t.customLabel}
                    quantity={item.quantity}
                    quantityLabel={t.quantity}
                    onDecrease={() =>
                      updateCustomAccessoryQuantity(
                        item.clientId ?? '',
                        item.quantity - 1,
                      )
                    }
                    onIncrease={() =>
                      updateCustomAccessoryQuantity(
                        item.clientId ?? '',
                        item.quantity + 1,
                      )
                    }
                    onRemove={() =>
                      setAddProduct({
                        customAccessories: form.customAccessories.filter(
                          (customItem) => customItem.clientId !== item.clientId,
                        ),
                      })
                    }
                    removeLabel={t.removeMedia}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
            <div>
              <div className="mb-2 text-xs font-semibold text-gf-muted">
                {t.browseAccessories}
              </div>
              <div className="overflow-hidden rounded-[8px] border border-gf-line bg-white">
                <div className="relative border-b border-gf-line p-3">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-gf-muted"
                  />
                  <Input
                    value={accessorySearch}
                    onChange={(event) => setAccessorySearch(event.target.value)}
                    placeholder={t.searchAccessories}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-[260px] overflow-y-auto p-2">
                  {filteredAccessories.length > 0 ? (
                    filteredAccessories.map((accessory) => {
                      const selected = form.accessories.some(
                        (item) => item.accessoryId === accessory.id,
                      )
                      return (
                        <label
                          key={accessory.id}
                          className={cn(
                            'flex min-h-11 cursor-pointer items-center gap-3 rounded-[6px] px-3 py-2 text-sm',
                            selected
                              ? 'bg-gf-pink-100 font-semibold text-gf-brown-900'
                              : 'text-gf-brown-700 hover:bg-gf-pink-50',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleAccessory(accessory.id)}
                            className="h-[17px] w-[17px] accent-gf-brown-800"
                          />
                          <span>{accessory.name}</span>
                        </label>
                      )
                    })
                  ) : (
                    <p className="px-3 py-8 text-center text-sm text-gf-muted">
                      {accessories.length === 0
                        ? t.noAccessories
                        : t.noAccessoryResults}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-gf-muted">
                {t.addOtherAccessory}
              </div>
              <div className="rounded-[8px] border border-gf-line bg-gf-pink-50 p-4">
                <Input
                  maxLength={120}
                  value={customAccessoryName}
                  onChange={(event) => setCustomAccessoryName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomAccessory()
                    }
                  }}
                  placeholder={t.customAccessoryPlaceholder}
                />
                <button
                  type="button"
                  onClick={addCustomAccessory}
                  disabled={!customAccessoryName.trim()}
                  className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-gf-brown-800 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                  {t.add}
                </button>
              </div>
            </div>
          </div>

          <div className="my-6 h-px bg-gf-line" />
          <SectionHeading title={t.deliveryAddress} description={t.deliveryAddressSub} />

          {addressesQuery.isLoading ? (
            <div className="flex min-h-[150px] items-center justify-center text-sm text-gf-muted">
              {t.loadingAddresses}
            </div>
          ) : addressesQuery.isError ? (
            <div className="flex min-h-[150px] items-center justify-center text-sm text-gf-red">
              {t.loadAddressesFailed}
            </div>
          ) : availableAddresses.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
              {availableAddresses.map((address) => (
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

          {availableAddresses.length > 0 && (
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
              {editId ? t.saveAndReview : t.submit}
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
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pr-[58px]"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gf-muted">
        THB
      </span>
    </div>
  )
}

function SelectedAccessoryRow({
  name,
  badge,
  quantity,
  quantityLabel,
  removeLabel,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  name: string
  badge?: string
  quantity: number
  quantityLabel: string
  removeLabel: string
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex min-h-[58px] items-center gap-3 px-3 py-2 sm:px-4">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-gf-brown-900">{name}</span>
        {badge && (
          <span className="ml-2 rounded-full bg-gf-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-gf-brown-700">
            {badge}
          </span>
        )}
      </div>
      <div className="flex h-9 shrink-0 items-center rounded-full border border-gf-brown-300 bg-white">
        <QuantityButton
          label={`- ${quantityLabel}`}
          onClick={onDecrease}
        >
          <Minus size={14} />
        </QuantityButton>
        <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
        <QuantityButton
          label={`+ ${quantityLabel}`}
          onClick={onIncrease}
        >
          <Plus size={14} />
        </QuantityButton>
      </div>
      <button
        type="button"
        title={removeLabel}
        aria-label={removeLabel}
        onClick={onRemove}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-gf-red hover:bg-gf-pink-100"
      >
        <Trash2 size={15} />
      </button>
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
const UPLOAD_BOX_CLASS =
  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-gf-brown-300 bg-gf-pink-100 text-[13px] text-gf-muted'
const DARK_BTN_CLASS =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-gf-brown-800 px-[26px] py-[13px] text-[15px] font-semibold text-gf-pink-100'
const OUTLINE_BTN_CLASS =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-800'
