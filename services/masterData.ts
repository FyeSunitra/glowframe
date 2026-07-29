import { api, fail, ok } from '@/lib/api'
import { buildListParams } from '@/lib/buildParams'
import type { ApiDataBody, ApiListBody, ApiResponse } from '@/types/api'
import type {
  Accessory,
  ActivePayload,
  Bank,
  BankPayload,
  Brand,
  Category,
  MasterListParams,
  MasterListMeta,
  MasterListResult,
  NamePayload,
} from '@/types/masterData'

function listParams(params?: MasterListParams) {
  return buildListParams(params)
}

function toListResult<T>(body: ApiListBody<T, MasterListMeta>): MasterListResult<T> {
  if (!body.meta) {
    throw new Error('Pagination metadata is missing from the master data response.')
  }

  return {
    items: body.data,
    meta: body.meta,
  }
}

export const masterDataService = {
  brands: {
    async list(params?: MasterListParams): Promise<ApiResponse<MasterListResult<Brand>>> {
      try {
        const body = await api.get<ApiListBody<Brand, MasterListMeta>>('/api/admin/master/brands', { params: listParams(params) })
        return ok(toListResult(body))
      } catch (err) {
        return fail(err, 'โหลดแบรนด์ไม่สำเร็จ')
      }
    },
    async get(id: number): Promise<ApiResponse<Brand>> {
      try {
        const body = await api.get<ApiDataBody<Brand>>(`/api/admin/master/brands/${id}`)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'โหลดแบรนด์ไม่สำเร็จ')
      }
    },
    async create(data: NamePayload): Promise<ApiResponse<Brand>> {
      try {
        const body = await api.post<ApiDataBody<Brand>>('/api/admin/master/brands', data)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'บันทึกแบรนด์ไม่สำเร็จ')
      }
    },
    async update(id: number, data: Partial<NamePayload & ActivePayload>): Promise<ApiResponse<Brand>> {
      try {
        const body = await api.patch<ApiDataBody<Brand>>(`/api/admin/master/brands/${id}`, data)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'บันทึกแบรนด์ไม่สำเร็จ')
      }
    },
    async delete(id: number): Promise<ApiResponse<null>> {
      try {
        await api.delete<{ data: null }>(`/api/admin/master/brands/${id}`)
        return ok(null)
      } catch (err) {
        return fail(err, 'ลบแบรนด์ไม่สำเร็จ')
      }
    },
  },
  categories: {
    async list(params?: MasterListParams): Promise<ApiResponse<MasterListResult<Category>>> {
      try {
        const body = await api.get<ApiListBody<Category, MasterListMeta>>('/api/admin/master/categories', { params: listParams(params) })
        return ok(toListResult(body))
      } catch (err) {
        return fail(err, 'โหลดหมวดหมู่ไม่สำเร็จ')
      }
    },
    async get(id: number): Promise<ApiResponse<Category>> {
      try {
        const body = await api.get<ApiDataBody<Category>>(`/api/admin/master/categories/${id}`)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'โหลดหมวดหมู่ไม่สำเร็จ')
      }
    },
    async create(data: NamePayload): Promise<ApiResponse<Category>> {
      try {
        const body = await api.post<ApiDataBody<Category>>('/api/admin/master/categories', data)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'บันทึกหมวดหมู่ไม่สำเร็จ')
      }
    },
    async update(id: number, data: Partial<NamePayload & ActivePayload>): Promise<ApiResponse<Category>> {
      try {
        const body = await api.patch<ApiDataBody<Category>>(`/api/admin/master/categories/${id}`, data)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'บันทึกหมวดหมู่ไม่สำเร็จ')
      }
    },
    async delete(id: number): Promise<ApiResponse<null>> {
      try {
        await api.delete<{ data: null }>(`/api/admin/master/categories/${id}`)
        return ok(null)
      } catch (err) {
        return fail(err, 'ลบหมวดหมู่ไม่สำเร็จ')
      }
    },
  },
  accessories: {
    async list(params?: MasterListParams): Promise<ApiResponse<MasterListResult<Accessory>>> {
      try {
        const body = await api.get<ApiListBody<Accessory, MasterListMeta>>('/api/admin/master/accessories', {
          params: listParams(params),
        })
        return ok(toListResult(body))
      } catch (err) {
        return fail(err, 'โหลดอุปกรณ์เสริมไม่สำเร็จ')
      }
    },
    async get(id: number): Promise<ApiResponse<Accessory>> {
      try {
        const body = await api.get<ApiDataBody<Accessory>>(`/api/admin/master/accessories/${id}`)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'โหลดอุปกรณ์เสริมไม่สำเร็จ')
      }
    },
    async create(data: NamePayload): Promise<ApiResponse<Accessory>> {
      try {
        const body = await api.post<ApiDataBody<Accessory>>('/api/admin/master/accessories', data)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'บันทึกอุปกรณ์เสริมไม่สำเร็จ')
      }
    },
    async update(id: number, data: Partial<NamePayload & ActivePayload>): Promise<ApiResponse<Accessory>> {
      try {
        const body = await api.patch<ApiDataBody<Accessory>>(`/api/admin/master/accessories/${id}`, data)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'บันทึกอุปกรณ์เสริมไม่สำเร็จ')
      }
    },
    async delete(id: number): Promise<ApiResponse<null>> {
      try {
        await api.delete<{ data: null }>(`/api/admin/master/accessories/${id}`)
        return ok(null)
      } catch (err) {
        return fail(err, 'ลบอุปกรณ์เสริมไม่สำเร็จ')
      }
    },
  },
  banks: {
    async list(params?: MasterListParams): Promise<ApiResponse<MasterListResult<Bank>>> {
      try {
        const body = await api.get<ApiListBody<Bank, MasterListMeta>>('/api/admin/master/banks', { params: listParams(params) })
        return ok(toListResult(body))
      } catch (err) {
        return fail(err, 'โหลดธนาคารไม่สำเร็จ')
      }
    },
    async get(id: number): Promise<ApiResponse<Bank>> {
      try {
        const body = await api.get<ApiDataBody<Bank>>(`/api/admin/master/banks/${id}`)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'โหลดธนาคารไม่สำเร็จ')
      }
    },
    async create(data: BankPayload): Promise<ApiResponse<Bank>> {
      try {
        const body = await api.post<ApiDataBody<Bank>>('/api/admin/master/banks', data)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'บันทึกธนาคารไม่สำเร็จ')
      }
    },
    async update(id: number, data: Partial<BankPayload & ActivePayload>): Promise<ApiResponse<Bank>> {
      try {
        const body = await api.patch<ApiDataBody<Bank>>(`/api/admin/master/banks/${id}`, data)
        return ok(body.data)
      } catch (err) {
        return fail(err, 'บันทึกธนาคารไม่สำเร็จ')
      }
    },
    async delete(id: number): Promise<ApiResponse<null>> {
      try {
        await api.delete<{ data: null }>(`/api/admin/master/banks/${id}`)
        return ok(null)
      } catch (err) {
        return fail(err, 'ลบธนาคารไม่สำเร็จ')
      }
    },
  },
}

export const publicMasterDataService = {
  brands: {
    async list(params?: MasterListParams): Promise<ApiResponse<MasterListResult<Brand>>> {
      try {
        const body = await api.get<ApiListBody<Brand, MasterListMeta>>('/api/master/brands', { params: listParams(params) })
        return ok(toListResult(body))
      } catch (err) {
        return fail(err, 'โหลดแบรนด์ไม่สำเร็จ')
      }
    },
  },
  categories: {
    async list(params?: MasterListParams): Promise<ApiResponse<MasterListResult<Category>>> {
      try {
        const body = await api.get<ApiListBody<Category, MasterListMeta>>('/api/master/categories', { params: listParams(params) })
        return ok(toListResult(body))
      } catch (err) {
        return fail(err, 'โหลดหมวดหมู่ไม่สำเร็จ')
      }
    },
  },
  accessories: {
    async list(params?: MasterListParams): Promise<ApiResponse<MasterListResult<Accessory>>> {
      try {
        const body = await api.get<ApiListBody<Accessory, MasterListMeta>>('/api/master/accessories', { params: listParams(params) })
        return ok(toListResult(body))
      } catch (err) {
        return fail(err, 'โหลดอุปกรณ์เสริมไม่สำเร็จ')
      }
    },
  },
  banks: {
    async list(params?: MasterListParams): Promise<ApiResponse<MasterListResult<Bank>>> {
      try {
        const body = await api.get<ApiListBody<Bank, MasterListMeta>>('/api/master/banks', { params: listParams(params) })
        return ok(toListResult(body))
      } catch (err) {
        return fail(err, 'โหลดธนาคารไม่สำเร็จ')
      }
    },
  },
}
