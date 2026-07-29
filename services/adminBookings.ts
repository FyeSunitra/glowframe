import { api, fail, ok } from '@/lib/api'
import { buildListParams } from '@/lib/buildParams'
import type { ApiDataBody, ApiListBody, ApiResponse } from '@/types/api'
import type {
  AdminBooking,
  AdminBookingList,
  AdminBookingQuery,
} from '@/types/adminBooking'

export const adminBookingService = {
  async list(
    params: AdminBookingQuery = {},
  ): Promise<ApiResponse<AdminBookingList>> {
    try {
      const body = await api.get<
        ApiListBody<AdminBooking, AdminBookingList['meta']>
      >('/api/admin/bookings', {
        params: buildListParams(params),
        cache: 'no-store',
      })
      if (!body.meta) throw new Error('Pagination metadata is missing.')
      return ok({ items: body.data, meta: body.meta })
    } catch (error) {
      return fail(error, 'Unable to load bookings.')
    }
  },

  async cancel(id: number): Promise<ApiResponse<AdminBooking>> {
    try {
      const body = await api.patch<ApiDataBody<AdminBooking>>(
        `/api/admin/bookings/${id}`,
        { action: 'cancel' },
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to cancel the booking.')
    }
  },
}
