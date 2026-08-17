import { api, fail, ok } from '@/lib/api'
import { buildListParams, type QueryParams } from '@/lib/buildParams'
import type { ApiListBody, ApiResponse } from '@/types/api'
import type {
  DeliveryOperation,
  DeliveryOperationQuery,
  OperationList,
  ReturnOperation,
  ReturnOperationQuery,
} from '@/types/adminOperations'

async function list<T>(path: string, params: QueryParams) {
  const body = await api.get<ApiListBody<T, OperationList<T>['meta']>>(path, {
    params: buildListParams(params),
    cache: 'no-store',
  })
  if (!body.meta) throw new Error('Pagination metadata is missing.')
  return { items: body.data, meta: body.meta }
}

export const adminOperationsService = {
  async returns(
    params: ReturnOperationQuery = {},
  ): Promise<ApiResponse<OperationList<ReturnOperation>>> {
    try {
      return ok(await list<ReturnOperation>('/api/admin/operations/returns', params))
    } catch (error) {
      return fail(error, 'Unable to load return operations.')
    }
  },

  async deliveries(
    params: DeliveryOperationQuery = {},
  ): Promise<ApiResponse<OperationList<DeliveryOperation>>> {
    try {
      return ok(await list<DeliveryOperation>('/api/admin/operations/delivery', params))
    } catch (error) {
      return fail(error, 'Unable to load delivery operations.')
    }
  },
}
