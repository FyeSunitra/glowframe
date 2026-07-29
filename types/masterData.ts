import type { QueryParams } from '@/lib/buildParams'

export interface MasterListQuery {
  page: number
  limit: number
  skip: number
  search?: string
  isActive?: boolean
}

export interface MasterListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface MasterListResult<T> {
  items: T[]
  meta: MasterListMeta
}

export interface MasterListParams extends QueryParams {
  page?: number
  limit?: number
  search?: string
  is_active?: boolean
}

export interface Brand {
  id: number
  name: string
  activeListings: number
  active: boolean
}

export interface Category {
  id: number
  name: string
  activeListings: number
  active: boolean
}

export interface Accessory {
  id: number
  name: string
  usedInListings: number
  active: boolean
}

export interface Bank {
  id: number
  code: string
  abbreviation: string
  name: string
  logoUrl: string | null
  usedInAccounts: number
  active: boolean
}

export interface NamePayload {
  name: string
}

export interface ActivePayload {
  active: boolean
}

export interface BankPayload {
  code: string
  abbreviation: string
  name: string
  logoUrl?: string | null
}
