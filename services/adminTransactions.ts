import { api, fail, ok } from '@/lib/api'
import { buildListParams } from '@/lib/buildParams'
import type { ApiDataBody, ApiListBody, ApiResponse } from '@/types/api'
import type {
  AdminTransaction,
  AdminTransactionList,
  AdminTransactionQuery,
  ReviewPaymentPayload,
} from '@/types/adminTransaction'

export const adminTransactionService = {
  async list(
    params: AdminTransactionQuery = {},
  ): Promise<ApiResponse<AdminTransactionList>> {
    try {
      const body = await api.get<
        ApiListBody<AdminTransaction, AdminTransactionList['meta']>
      >('/api/admin/transactions', {
        params: buildListParams(params),
        cache: 'no-store',
      })
      if (!body.meta) throw new Error('Pagination metadata is missing.')
      return ok({ items: body.data, meta: body.meta })
    } catch (error) {
      return fail(error, 'Unable to load payment transactions.')
    }
  },

  async review(
    id: number,
    payload: ReviewPaymentPayload,
  ): Promise<ApiResponse<AdminTransaction>> {
    try {
      const body = await api.patch<ApiDataBody<AdminTransaction>>(
        `/api/admin/transactions/${id}`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to review the payment evidence.')
    }
  },
}
