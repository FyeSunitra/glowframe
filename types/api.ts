export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export interface ApiDataBody<T> {
  data: T
}

export interface ApiListBody<T, TMeta = unknown> {
  data: T[]
  meta?: TMeta
}
