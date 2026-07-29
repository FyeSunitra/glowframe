import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type {
  AdminProduct,
  AdminProductQuery,
  UpdateAdminProductPayload,
} from '@/types/adminProduct'

export const adminProductService = {
  async list(params: AdminProductQuery = {}): Promise<ApiResponse<AdminProduct[]>> {
    try {
      const body = await api.get<ApiDataBody<AdminProduct[]>>('/api/admin/products', {
        params,
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load product listings.')
    }
  },

  async get(id: number): Promise<ApiResponse<AdminProduct>> {
    try {
      const body = await api.get<ApiDataBody<AdminProduct>>(
        `/api/admin/products/${id}`,
        { cache: 'no-store' },
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load product details.')
    }
  },

  async update(
    id: number,
    payload: UpdateAdminProductPayload,
  ): Promise<ApiResponse<AdminProduct>> {
    try {
      const body = await api.patch<ApiDataBody<AdminProduct>>(
        `/api/admin/products/${id}`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to update the product listing.')
    }
  },

  async remove(id: number): Promise<ApiResponse<null>> {
    try {
      const body = await api.delete<ApiDataBody<null>>(`/api/admin/products/${id}`)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to delete the product listing.')
    }
  },
}
