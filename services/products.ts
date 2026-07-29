import { api, fail, ok } from '@/lib/api'
import type { Product } from '@/types'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type {
  CreateProductPayload,
  ProductMediaFiles,
  ProductMediaInput,
  ProductMediaType,
  ProductMediaUploadSignature,
  OwnerProductAction,
  UpdateOwnerProductPayload,
} from '@/types/product'

export const productService = {
  async list(): Promise<ApiResponse<Product[]>> {
    try {
      const body = await api.get<ApiDataBody<Product[]>>('/api/products', {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ไม่สามารถโหลดรายการสินค้าได้')
    }
  },

  async get(id: number | string): Promise<ApiResponse<Product>> {
    try {
      const body = await api.get<ApiDataBody<Product>>(`/api/products/${id}`, {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ไม่สามารถโหลดรายละเอียดสินค้าได้')
    }
  },

  async mine(): Promise<ApiResponse<Product[]>> {
    try {
      const body = await api.get<ApiDataBody<Product[]>>('/api/products/mine', {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ไม่สามารถโหลดสินค้าของคุณได้')
    }
  },

  async getMine(id: number): Promise<ApiResponse<Product>> {
    try {
      const body = await api.get<ApiDataBody<Product>>(`/api/products/mine/${id}`, {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ไม่สามารถโหลดรายละเอียดสินค้าได้')
    }
  },

  async updateMine(
    id: number,
    data: Omit<UpdateOwnerProductPayload, 'media'>,
    retainedMedia: ProductMediaInput[],
    files: ProductMediaFiles,
  ): Promise<ApiResponse<Product>> {
    let uploadedMedia: ProductMediaInput[] = []
    try {
      if (files.images.length || files.video) {
        const signatureBody = await api.post<
          ApiDataBody<ProductMediaUploadSignature>
        >('/api/products/media')
        uploadedMedia = await uploadProductMedia(signatureBody.data, files)
      }
      const body = await api.patch<ApiDataBody<Product>>(
        `/api/products/mine/${id}`,
        { ...data, media: [...retainedMedia, ...uploadedMedia] },
      )
      return ok(body.data)
    } catch (error) {
      if (uploadedMedia.length) await cleanUpProductMedia(uploadedMedia)
      return fail(error, 'ไม่สามารถแก้ไขสินค้าได้')
    }
  },

  async changeMineStatus(
    id: number,
    action: OwnerProductAction,
  ): Promise<ApiResponse<Product>> {
    try {
      const body = await api.patch<ApiDataBody<Product>>(
        `/api/products/mine/${id}`,
        { action },
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ไม่สามารถเปลี่ยนสถานะสินค้าได้')
    }
  },

  async create(
    data: Omit<CreateProductPayload, 'media'>,
    files: ProductMediaFiles,
  ): Promise<ApiResponse<Product>> {
    let uploadedMedia: ProductMediaInput[] = []

    try {
      const signatureBody = await api.post<
        ApiDataBody<ProductMediaUploadSignature>
      >('/api/products/media')
      uploadedMedia = await uploadProductMedia(signatureBody.data, files)

      const body = await api.post<ApiDataBody<Product>>('/api/products', {
        ...data,
        media: uploadedMedia,
      })
      return ok(body.data)
    } catch (error) {
      if (uploadedMedia.length) {
        await cleanUpProductMedia(uploadedMedia)
      }
      return fail(error, 'ไม่สามารถส่งสินค้าเพื่อตรวจสอบได้')
    }
  },
}

async function uploadProductMedia(
  signature: ProductMediaUploadSignature,
  files: ProductMediaFiles,
) {
  const items = [
    ...files.images.map((file, index) => ({
      file,
      mediaType: 'image' as const,
      sortOrder: index,
    })),
    ...(files.video
      ? [
          {
            file: files.video,
            mediaType: 'video' as const,
            sortOrder: files.images.length,
          },
        ]
      : []),
  ]

  const results = await Promise.allSettled(
    items.map(async (item) => ({
      sortOrder: item.sortOrder,
      media: await uploadToCloudinary(signature, item.file, item.mediaType),
    })),
  )
  const uploaded = results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )

  if (results.some((result) => result.status === 'rejected')) {
    await cleanUpProductMedia(uploaded.map((item) => item.media))
    throw new Error('One or more product media files could not be uploaded.')
  }

  return uploaded
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.media)
}

async function uploadToCloudinary(
  signature: ProductMediaUploadSignature,
  file: File,
  mediaType: ProductMediaType,
): Promise<ProductMediaInput> {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('api_key', signature.apiKey)
  formData.set('timestamp', String(signature.timestamp))
  formData.set('folder', signature.folder)
  formData.set('signature', signature.signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )
  const body = await response.json()

  if (
    !response.ok ||
    typeof body?.secure_url !== 'string' ||
    typeof body?.public_id !== 'string' ||
    body?.resource_type !== mediaType
  ) {
    throw new Error(
      typeof body?.error?.message === 'string'
        ? body.error.message
        : 'Cloudinary upload failed.',
    )
  }

  return {
    mediaType,
    url: body.secure_url,
    publicId: body.public_id,
  }
}

async function cleanUpProductMedia(media: ProductMediaInput[]) {
  try {
    await api.delete<ApiDataBody<null>>('/api/products/media', {
      body: { media },
    })
  } catch (error) {
    console.error('Failed to clean up uploaded product media', error)
  }
}
