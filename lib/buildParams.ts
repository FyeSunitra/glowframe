export type QueryParamValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>

export const defaultListParams = {
  page: 1,
  limit: 50,
} as const

export function buildParams(params?: QueryParams) {
  const searchParams = new URLSearchParams()

  if (!params) return searchParams

  for (const [key, rawValue] of Object.entries(params)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue]

    for (const value of values) {
      if (value === undefined || value === null || value === '') continue
      searchParams.append(key, String(value))
    }
  }

  return searchParams
}

export function buildListParams(params?: QueryParams) {
  return buildParams({
    ...defaultListParams,
    ...params,
  })
}
