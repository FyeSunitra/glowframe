import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { PublicBookingSettings } from '@/types/bookingSettings'

export const bookingSettingsService = {
  async get(): Promise<ApiResponse<PublicBookingSettings>> {
    try {
      const body = await api.get<ApiDataBody<PublicBookingSettings>>('/api/booking-settings', {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load booking settings.')
    }
  },
}
