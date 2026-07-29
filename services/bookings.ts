import { api, fail, ok } from '@/lib/api'
import { buildListParams } from '@/lib/buildParams'
import type { ApiDataBody, ApiListBody, ApiResponse } from '@/types/api'
import type {
  CreateBookingPayload,
  RenterBooking,
  RenterBookingList,
  RenterBookingListMeta,
  BookingViewRole,
  BookingEvidenceKind,
  BookingEvidenceUpload,
  OwnerBookingActionPayload,
  RenterBookingActionPayload,
} from '@/types/booking'
import type { ProductMediaUploadSignature } from '@/types/product'

export const bookingService = {
  async create(data: CreateBookingPayload): Promise<ApiResponse<RenterBooking>> {
    try {
      const formData = new FormData()
      formData.set('productId', String(data.productId))
      formData.set('paymentAccountId', String(data.paymentAccountId))
      formData.set('startDate', data.startDate)
      formData.set('endDate', data.endDate)
      formData.set('deliveryMethod', data.deliveryMethod)
      formData.set('proof', data.proofFile)
      const body = await api.post<ApiDataBody<RenterBooking>>(
        '/api/bookings',
        formData,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ส่งคำขอเช่าไม่สำเร็จ')
    }
  },

  async list(params?: {
    page?: number
    limit?: number
    filter?: 'all' | 'ongoing' | 'completed' | 'cancelled'
    role?: BookingViewRole
  }): Promise<ApiResponse<RenterBookingList>> {
    try {
      const body = await api.get<ApiListBody<RenterBooking, RenterBookingListMeta>>(
        '/api/bookings',
        { params: buildListParams(params) },
      )
      if (!body.meta) throw new Error('Pagination metadata is missing.')
      return ok({ items: body.data, meta: body.meta })
    } catch (error) {
      return fail(error, 'โหลดรายการเช่าไม่สำเร็จ')
    }
  },

  async get(id: number): Promise<ApiResponse<RenterBooking>> {
    try {
      const body = await api.get<ApiDataBody<RenterBooking>>(`/api/bookings/${id}`)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดรายละเอียดการเช่าไม่สำเร็จ')
    }
  },

  async ownerAction(
    id: number,
    payload: OwnerBookingActionPayload,
  ): Promise<ApiResponse<RenterBooking>> {
    try {
      const body = await api.patch<ApiDataBody<RenterBooking>>(
        `/api/bookings/${id}/owner`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ไม่สามารถอัปเดตรายการให้เช่าได้')
    }
  },

  async renterAction(
    id: number,
    payload: RenterBookingActionPayload,
  ): Promise<ApiResponse<RenterBooking>> {
    try {
      const body = await api.patch<ApiDataBody<RenterBooking>>(
        `/api/bookings/${id}/renter`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ไม่สามารถอัปเดตรายการเช่าได้')
    }
  },

  async uploadEvidence(
    id: number,
    kind: BookingEvidenceKind,
    file: File,
  ): Promise<ApiResponse<BookingEvidenceUpload>> {
    try {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size === 0 ||
        file.size > 10 * 1024 * 1024
      ) {
        throw new Error('Evidence must be a JPG, PNG, or WEBP image up to 10 MB.')
      }
      const signature = await api.post<ApiDataBody<ProductMediaUploadSignature>>(
        `/api/bookings/${id}/evidence`,
        { kind },
      )
      const formData = new FormData()
      formData.set('file', file)
      formData.set('api_key', signature.data.apiKey)
      formData.set('timestamp', String(signature.data.timestamp))
      formData.set('folder', signature.data.folder)
      formData.set('signature', signature.data.signature)
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.data.cloudName)}/image/upload`,
        { method: 'POST', body: formData },
      )
      const body = await response.json()
      if (
        !response.ok ||
        typeof body?.secure_url !== 'string' ||
        typeof body?.public_id !== 'string'
      ) {
        throw new Error(
          typeof body?.error?.message === 'string'
            ? body.error.message
            : 'Evidence upload failed.',
        )
      }
      return ok({ url: body.secure_url, publicId: body.public_id })
    } catch (error) {
      return fail(error, 'อัปโหลดหลักฐานไม่สำเร็จ')
    }
  },

  async cleanUpEvidence(
    id: number,
    kind: BookingEvidenceKind,
    publicId: string,
  ) {
    try {
      await api.delete<ApiDataBody<null>>(`/api/bookings/${id}/evidence`, {
        body: { kind, publicId },
      })
    } catch (error) {
      console.error('Failed to clean up booking evidence', error)
    }
  },
}
