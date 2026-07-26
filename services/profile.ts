import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { ProfileData, UpdateProfilePayload } from '@/types/profile'

export const profileService = {
  async get(): Promise<ApiResponse<ProfileData>> {
    try {
      const body = await api.get<ApiDataBody<ProfileData>>('/api/user', {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ')
    }
  },

  async update(payload: UpdateProfilePayload): Promise<ApiResponse<ProfileData>> {
    try {
      const body = await api.put<ApiDataBody<ProfileData>>('/api/user', payload)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ')
    }
  },
}
