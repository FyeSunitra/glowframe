import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { AdminDashboardData } from '@/types/adminDashboard'

export const adminDashboardService = {
  async get(): Promise<ApiResponse<AdminDashboardData>> {
    try {
      const body = await api.get<ApiDataBody<AdminDashboardData>>(
        '/api/admin/stats',
        { cache: 'no-store' },
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load dashboard data.')
    }
  },
}
