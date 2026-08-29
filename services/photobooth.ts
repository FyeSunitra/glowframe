import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiListBody, ApiResponse } from '@/types/api'
import type {
  PhotoboothFrame,
  PhotoboothFrameList,
  PhotoboothFrameInput,
  PhotoboothUploadSignature,
} from '@/types/photobooth'

export const photoboothService = {
  async list(): Promise<ApiResponse<PhotoboothFrame[]>> {
    try {
      const body = await api.get<ApiDataBody<PhotoboothFrame[]>>('/api/photobooth/frames', {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load photobooth frames.')
    }
  },

  async get(id: number | string): Promise<ApiResponse<PhotoboothFrame>> {
    try {
      const body = await api.get<ApiDataBody<PhotoboothFrame>>(`/api/photobooth/frames/${id}`, {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load this photobooth frame.')
    }
  },
}

export const adminPhotoboothService = {
  async list(params: { page?: number; limit?: number; search?: string } = {}): Promise<ApiResponse<PhotoboothFrameList>> {
    try {
      const body = await api.get<ApiListBody<PhotoboothFrame, PhotoboothFrameList['meta']>>('/api/admin/photobooth/frames', {
        params,
        cache: 'no-store',
      })
      if (!body.meta) throw new Error('Pagination metadata is missing.')
      return ok({ items: body.data, meta: body.meta })
    } catch (error) {
      return fail(error, 'Unable to load photobooth frames.')
    }
  },

  async create(
    input: Omit<PhotoboothFrameInput, 'overlayUrl' | 'overlayPublicId'>,
    file: File,
  ): Promise<ApiResponse<PhotoboothFrame>> {
    let uploaded: { url: string; publicId: string } | null = null
    try {
      const signatureBody = await api.post<ApiDataBody<PhotoboothUploadSignature>>(
        '/api/admin/photobooth/frames/media',
      )
      uploaded = await uploadFrame(signatureBody.data, file)
      const body = await api.post<ApiDataBody<PhotoboothFrame>>(
        '/api/admin/photobooth/frames',
        { ...input, overlayUrl: uploaded.url, overlayPublicId: uploaded.publicId },
      )
      return ok(body.data)
    } catch (error) {
      if (uploaded) {
        await api.delete('/api/admin/photobooth/frames/media', {
          body: { publicId: uploaded.publicId },
        }).catch(() => undefined)
      }
      return fail(error, 'Unable to create the photobooth frame.')
    }
  },

  async update(
    id: number,
    input: Partial<PhotoboothFrameInput>,
    file?: File,
    previousPublicId?: string,
  ): Promise<ApiResponse<PhotoboothFrame>> {
    let uploaded: { url: string; publicId: string } | null = null
    try {
      if (file) {
        const signatureBody = await api.post<ApiDataBody<PhotoboothUploadSignature>>(
          '/api/admin/photobooth/frames/media',
        )
        uploaded = await uploadFrame(signatureBody.data, file)
      }
      const body = await api.patch<ApiDataBody<PhotoboothFrame>>(
        `/api/admin/photobooth/frames/${id}`,
        uploaded
          ? {
              ...input,
              overlayUrl: uploaded.url,
              overlayPublicId: uploaded.publicId,
              originalFileName: file?.name,
            }
          : input,
      )
      if (uploaded && previousPublicId && previousPublicId !== uploaded.publicId) {
        await api.delete('/api/admin/photobooth/frames/media', {
          body: { publicId: previousPublicId },
        }).catch(() => undefined)
      }
      return ok(body.data)
    } catch (error) {
      if (uploaded) {
        await api.delete('/api/admin/photobooth/frames/media', {
          body: { publicId: uploaded.publicId },
        }).catch(() => undefined)
      }
      return fail(error, 'Unable to update the photobooth frame.')
    }
  },

  async remove(id: number): Promise<ApiResponse<null>> {
    try {
      await api.delete<ApiDataBody<null>>(`/api/admin/photobooth/frames/${id}`)
      return ok(null)
    } catch (error) {
      return fail(error, 'Unable to delete the photobooth frame.')
    }
  },
}

async function uploadFrame(signature: PhotoboothUploadSignature, file: File) {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('api_key', signature.apiKey)
  formData.set('timestamp', String(signature.timestamp))
  formData.set('folder', signature.folder)
  formData.set('signature', signature.signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    { method: 'POST', body: formData },
  )
  const body = await response.json()
  if (!response.ok || typeof body?.secure_url !== 'string' || typeof body?.public_id !== 'string') {
    throw new Error(body?.error?.message || 'Cloudinary upload failed.')
  }
  return { url: body.secure_url as string, publicId: body.public_id as string }
}
