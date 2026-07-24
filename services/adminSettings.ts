import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { AdminSettings, AdminSettingsPatchPayload } from '@/types/adminSettings'

export const adminSettingsService = {
  async getSettings(): Promise<ApiResponse<AdminSettings>> {
    try {
      const body = await api.get<ApiDataBody<AdminSettings>>('/api/admin/settings')
      return ok(body.data)
    } catch (err) {
      return fail(err, 'โหลดการตั้งค่าไม่สำเร็จ')
    }
  },

  async updateSettings(payload: AdminSettingsPatchPayload): Promise<ApiResponse<AdminSettings>> {
    try {
      const body = await api.patch<ApiDataBody<AdminSettings>>('/api/admin/settings', payload)
      return ok(body.data)
    } catch (err) {
      return fail(err, 'บันทึกการตั้งค่าไม่สำเร็จ')
    }
  },
}
