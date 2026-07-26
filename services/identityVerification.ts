import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { IdentityVerificationData } from '@/types/identityVerification'

export const identityVerificationService = {
  async get(): Promise<ApiResponse<IdentityVerificationData>> {
    try {
      const body = await api.get<ApiDataBody<IdentityVerificationData>>(
        '/api/user/identity-verification',
        { cache: 'no-store' },
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดสถานะการยืนยันตัวตนไม่สำเร็จ')
    }
  },

  async upload(document: File): Promise<ApiResponse<IdentityVerificationData>> {
    try {
      const formData = new FormData()
      formData.append('document', document)
      const body = await api.post<ApiDataBody<IdentityVerificationData>>(
        '/api/user/identity-verification',
        formData,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'อัปโหลดเอกสารยืนยันตัวตนไม่สำเร็จ')
    }
  },
}
