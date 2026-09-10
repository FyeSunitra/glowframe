'use client'

import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { unwrapApiResponse } from '@/lib/api'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { cn } from '@/lib/utils'
import { getMenuText } from '@/lib/menuI18n'
import { notificationService } from '@/services/notifications'
import { useAppStore } from '@/store/appStore'
import type { AppNotification } from '@/types/notification'

const INBOX_QUERY_KEY = ['notifications', 'inbox'] as const

export function NotificationBell() {
  const locale = useAppStore((state) => state.locale)
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const userId = useAppStore((state) => state.user.id)
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = getMenuText(locale)
  const enabled = isAuthenticated && typeof userId === 'number'
  const inbox = useQuery({
    queryKey: [...INBOX_QUERY_KEY, userId],
    queryFn: () => notificationService.list().then(unwrapApiResponse),
    enabled,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  })
  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id).then(unwrapApiResponse),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY }),
  })
  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead().then(unwrapApiResponse),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY }),
  })

  useEffect(() => {
    if (!enabled || !userId) return
    let active = true
    let channel: ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null = null

    async function subscribe() {
      const token = await notificationService.realtimeToken()
      if (!active || !token.success) return

      const client = getSupabaseBrowserClient()
      await client.realtime.setAuth(token.data.accessToken)
      if (!active || channel) return
      channel = client
        .channel(`notifications:${userId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`,
        }, () => {
          void queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY })
        })
        .subscribe()
    }

    void subscribe()
    const refresh = window.setInterval(() => void subscribe(), 45 * 60 * 1_000)
    return () => {
      active = false
      window.clearInterval(refresh)
      if (channel) void getSupabaseBrowserClient().removeChannel(channel)
    }
  }, [enabled, queryClient, userId])

  const unreadCount = inbox.data?.unreadCount ?? 0
  const badge = unreadCount > 99 ? '99+' : String(unreadCount)

  function openNotification(item: AppNotification) {
    if (!item.readAt) markRead.mutate(item.id)
    if (item.linkUrl) router.push(item.linkUrl)
  }

  const relativeTime = useMemo(() => new Intl.RelativeTimeFormat(locale === 'th' ? 'th-TH' : 'en', { numeric: 'auto' }), [locale])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t.notifications}
        title={t.notifications}
        className="relative flex size-[38px] items-center justify-center rounded-full border-0 bg-gf-pink-100 text-gf-brown-700"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-gf-red px-1 text-[10px] font-bold leading-5 text-white">
            {badge}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(360px,calc(100vw-32px))] rounded-[8px] bg-white p-0">
        <div className="flex items-center justify-between border-b border-gf-line px-4 py-3">
          <span className="text-sm font-bold text-gf-brown-900">{t.notifications}</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold text-gf-brown-700 hover:text-gf-brown-900 disabled:opacity-50"
            >
              <CheckCheck size={15} />
              {locale === 'th' ? 'อ่านทั้งหมด' : 'Mark all read'}
            </button>
          )}
        </div>
        <div className="max-h-[min(430px,calc(100vh-120px))] overflow-y-auto p-1.5">
          {inbox.isLoading ? (
            <div className="flex min-h-24 items-center justify-center text-gf-muted"><LoaderCircle className="animate-spin" size={19} /></div>
          ) : inbox.data?.items.length ? (
            inbox.data.items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => openNotification(item)}
                className={cn(
                  'block cursor-pointer rounded-[6px] px-3 py-3 whitespace-normal',
                  !item.readAt && 'bg-gf-pink-100/55',
                )}
              >
                <div className="flex gap-2.5">
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.readAt ? 'bg-transparent' : 'bg-gf-pink-500')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-5 text-gf-brown-900">{item.title}</span>
                    {item.body && <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-gf-muted">{item.body}</span>}
                    <span className="mt-1 block text-[11px] text-gf-muted">{formatRelativeTime(relativeTime, item.createdAt)}</span>
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-4 py-9 text-center text-sm text-gf-muted">{t.noNotifications}</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatRelativeTime(formatter: Intl.RelativeTimeFormat, value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1_000)
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}
