import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { PlatformReceivingAccount } from '@/types/payment'

export const paymentService = {
  async listReceivingAccounts(): Promise<ApiResponse<PlatformReceivingAccount[]>> {
    try {
      const body = await api.get<ApiDataBody<PlatformReceivingAccount[]>>(
        '/api/payment-accounts',
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดช่องทางการชำระเงินไม่สำเร็จ')
    }
  },
}
