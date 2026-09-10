export interface AppNotification {
  id: number
  type: string
  title: string
  body: string | null
  linkUrl: string | null
  readAt: string | null
  createdAt: string
}

export interface NotificationInbox {
  items: AppNotification[]
  unreadCount: number
}
