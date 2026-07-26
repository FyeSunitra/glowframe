import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { District, Province, Subdistrict } from '@/types/location'

export const locationService = {
  async provinces(): Promise<ApiResponse<Province[]>> {
    try {
      const body = await api.get<ApiDataBody<Province[]>>('/api/locations/provinces')
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดข้อมูลจังหวัดไม่สำเร็จ')
    }
  },

  async districts(provinceId: number): Promise<ApiResponse<District[]>> {
    try {
      const body = await api.get<ApiDataBody<District[]>>(
        `/api/locations/provinces/${provinceId}/districts`,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดข้อมูลอำเภอไม่สำเร็จ')
    }
  },

  async subdistricts(districtId: number): Promise<ApiResponse<Subdistrict[]>> {
    try {
      const body = await api.get<ApiDataBody<Subdistrict[]>>(
        `/api/locations/districts/${districtId}/subdistricts`,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดข้อมูลตำบลไม่สำเร็จ')
    }
  },
}
