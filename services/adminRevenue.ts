import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { AdminRevenueData, RevenuePeriod } from '@/types/adminRevenue'

export const adminRevenueService = {
  async get(period: RevenuePeriod): Promise<ApiResponse<AdminRevenueData>> {
    try {
      const body = await api.get<ApiDataBody<AdminRevenueData>>('/api/admin/financial/revenue', { params: { period }, cache: 'no-store' })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load revenue data.')
    }
  },
}
