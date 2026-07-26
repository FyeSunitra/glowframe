import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type {
  AdminKycQuery,
  AdminKycRequest,
  AdminKycReviewPayload,
} from '@/types/adminKyc'

export const adminKycService = {
  async list(params: AdminKycQuery = {}): Promise<ApiResponse<AdminKycRequest[]>> {
    try {
      const body = await api.get<ApiDataBody<AdminKycRequest[]>>(
        '/api/admin/trust/kyc',
        { params, cache: 'no-store' },
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดรายการยืนยันตัวตนไม่สำเร็จ')
    }
  },

  async review(
    id: string,
    payload: AdminKycReviewPayload,
  ): Promise<ApiResponse<AdminKycRequest>> {
    try {
      const body = await api.patch<ApiDataBody<AdminKycRequest>>(
        `/api/admin/trust/kyc/${id}`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'บันทึกผลการตรวจสอบไม่สำเร็จ')
    }
  },
}
