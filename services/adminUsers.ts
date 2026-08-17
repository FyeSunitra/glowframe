import { api, fail, ok } from '@/lib/api'
import { buildListParams } from '@/lib/buildParams'
import type { ApiDataBody, ApiListBody, ApiResponse } from '@/types/api'
import type {
  AdminUser,
  AdminUserList,
  AdminUserQuery,
} from '@/types/adminUser'

export const adminUserService = {
  async list(
    params: AdminUserQuery = {},
  ): Promise<ApiResponse<AdminUserList>> {
    try {
      const body = await api.get<
        ApiListBody<AdminUser, AdminUserList['meta']>
      >('/api/admin/users', {
        params: buildListParams(params),
        cache: 'no-store',
      })
      if (!body.meta) throw new Error('Pagination metadata is missing.')
      return ok({ items: body.data, meta: body.meta })
    } catch (error) {
      return fail(error, 'Unable to load users.')
    }
  },

  async setSuspended(
    id: number,
    suspended: boolean,
  ): Promise<ApiResponse<AdminUser>> {
    try {
      const body = await api.patch<ApiDataBody<AdminUser>>(
        `/api/admin/users/${id}`,
        { action: suspended ? 'suspend' : 'unsuspend' },
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to update the user account.')
    }
  },
}
