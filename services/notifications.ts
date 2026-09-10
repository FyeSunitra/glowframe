import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { AppNotification, NotificationInbox } from '@/types/notification'

export const notificationService = {
  async list(limit = 12): Promise<ApiResponse<NotificationInbox>> {
    try {
      const body = await api.get<ApiDataBody<NotificationInbox>>('/api/notifications', {
        params: { limit },
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load notifications.')
    }
  },

  async markRead(id: number): Promise<ApiResponse<AppNotification>> {
    try {
      const body = await api.patch<ApiDataBody<AppNotification>>(`/api/notifications/${id}`)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to update notification.')
    }
  },

  async markAllRead(): Promise<ApiResponse<{ updated: number }>> {
    try {
      const body = await api.patch<ApiDataBody<{ updated: number }>>('/api/notifications/read-all')
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to update notifications.')
    }
  },

  async realtimeToken(): Promise<ApiResponse<{ accessToken: string; expiresAt: string | null }>> {
    try {
      const body = await api.get<ApiDataBody<{ accessToken: string; expiresAt: string | null }>>(
        '/api/notifications/realtime-token',
        { cache: 'no-store' },
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to connect notification updates.')
    }
  },
}
