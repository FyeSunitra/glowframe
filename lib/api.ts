import { buildParams, type QueryParams } from './buildParams'
import type { ApiResponse } from '@/types/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type ApiQueryParams = QueryParams | URLSearchParams

interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  params?: ApiQueryParams
  body?: unknown
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function fail(error: unknown, fallback = 'Request failed'): ApiResponse<never> {
  if (error instanceof ApiError) {
    return { success: false, error: error.message || fallback }
  }

  if (error instanceof Error) {
    return { success: false, error: error.message || fallback }
  }

  return { success: false, error: fallback }
}

export function unwrapApiResponse<T>(response: ApiResponse<T>) {
  if (response.success) return response.data
  throw new Error(response.error)
}

function withParams(path: string, params?: ApiQueryParams) {
  const query = params instanceof URLSearchParams ? params : buildParams(params)
  const queryString = query.toString()

  return queryString ? `${path}?${queryString}` : path
}

async function request<T>(method: HttpMethod, path: string, options: ApiRequestOptions = {}) {
  const { params, body, headers, ...init } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const response = await fetch(withParams(path, params), {
    ...init,
    method,
    headers: {
      ...(isFormData || body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`

    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>('DELETE', path, options),
}
