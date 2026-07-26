import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { Address, AddressPayload } from '@/types/address'

export const addressService = {
  async list(): Promise<ApiResponse<Address[]>> {
    try {
      const body = await api.get<ApiDataBody<Address[]>>('/api/user/addresses', {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'โหลดที่อยู่ไม่สำเร็จ')
    }
  },

  async create(payload: AddressPayload): Promise<ApiResponse<Address>> {
    try {
      const body = await api.post<ApiDataBody<Address>>('/api/user/addresses', payload)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'บันทึกที่อยู่ไม่สำเร็จ')
    }
  },

  async update(id: number, payload: AddressPayload): Promise<ApiResponse<Address>> {
    try {
      const body = await api.patch<ApiDataBody<Address>>(
        `/api/user/addresses/${id}`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'แก้ไขที่อยู่ไม่สำเร็จ')
    }
  },

  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      await api.delete(`/api/user/addresses/${id}`)
      return ok(null)
    } catch (error) {
      return fail(error, 'ลบที่อยู่ไม่สำเร็จ')
    }
  },
}
