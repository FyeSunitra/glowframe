import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type {
  CreatePolicyVersionPayload,
  PolicyAction,
  PolicyDocumentType,
  PolicyVersion,
  RequiredPolicy,
  RequiredPolicyParams,
} from '@/types/policy'

export const policyService = {
  async listRequired(params: RequiredPolicyParams): Promise<ApiResponse<RequiredPolicy[]>> {
    try {
      const body = await api.get<ApiDataBody<RequiredPolicy[]>>('/api/policies/required', {
        params: {
          locale: params.locale,
          context: params.context ?? 'signup',
        },
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดข้อกำหนดและนโยบายไม่สำเร็จ')
    }
  },
}

export const adminPolicyService = {
  async list(docType: PolicyDocumentType): Promise<ApiResponse<PolicyVersion[]>> {
    try {
      const body = await api.get<ApiDataBody<PolicyVersion[]>>('/api/admin/legal/terms', {
        params: { type: docType },
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load policy versions')
    }
  },

  async create(data: CreatePolicyVersionPayload): Promise<ApiResponse<PolicyVersion>> {
    try {
      const body = await api.post<ApiDataBody<PolicyVersion>>('/api/admin/legal/terms', data)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to create the policy version')
    }
  },

  async applyAction(id: number, action: PolicyAction): Promise<ApiResponse<null>> {
    try {
      await api.patch<{ ok: true }>(`/api/admin/legal/terms/${id}`, { action })
      return ok(null)
    } catch (error) {
      return fail(error, 'Unable to update the policy version')
    }
  },
}
