import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { RequiredPolicy } from '@/types/policy'

export const policyService = {
  async listRequired(): Promise<ApiResponse<RequiredPolicy[]>> {
    try {
      const body = await api.get<ApiDataBody<RequiredPolicy[]>>('/api/policies/required')
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดข้อกำหนดและนโยบายไม่สำเร็จ')
    }
  },
}
