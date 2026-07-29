import { api, fail, ok } from '@/lib/api'
import { buildListParams } from '@/lib/buildParams'
import type { ApiDataBody, ApiListBody, ApiResponse } from '@/types/api'
import type {
  AdminDispute,
  AdminDisputeList,
  AdminDisputeQuery,
  ResolveDamagePayload,
} from '@/types/adminDispute'

export const adminDisputeService = {
  async list(
    params: AdminDisputeQuery = {},
  ): Promise<ApiResponse<AdminDisputeList>> {
    try {
      const body = await api.get<
        ApiListBody<AdminDispute, AdminDisputeList['meta']>
      >('/api/admin/trust/disputes', {
        params: buildListParams(params),
        cache: 'no-store',
      })
      if (!body.meta) throw new Error('Pagination metadata is missing.')
      return ok({ items: body.data, meta: body.meta })
    } catch (error) {
      return fail(error, 'Unable to load damage claims.')
    }
  },

  async resolve(
    id: number,
    payload: ResolveDamagePayload,
  ): Promise<ApiResponse<AdminDispute>> {
    try {
      const body = await api.patch<ApiDataBody<AdminDispute>>(
        `/api/admin/trust/disputes/${id}`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to resolve the damage claim.')
    }
  },
}
