'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bell, ClipboardList, Handshake, CheckCircle, Check, BookOpen } from 'lucide-react'
import type { Notification } from '@/types/database'
import { toast } from 'sonner'
import Link from 'next/link'

interface NotificationsClientProps {
  notifications: Notification[]
  userId: string
}

export default function NotificationsClient({ notifications: initialNotifications, userId }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error('Bildirim güncellenemedi')

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      toast.error('Bildirim okundu olarak işaretlenemedi.')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mark_all: true }),
      })

      if (!response.ok) throw new Error('Bildirimler güncellenemedi')

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('Tüm bildirimler okundu olarak işaretlendi.')
    } catch (error) {
      toast.error('Bildirimler güncellenemedi.')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'job_application':
        return <ClipboardList className="h-5 w-5 text-blue-500" />
      case 'interview_request':
        return <Handshake className="h-5 w-5 text-green-500" />
      case 'application_success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'yearbook_entry':
        return <BookOpen className="h-5 w-5 text-indigo-500" />
      case 'system':
      default:
        return <Bell className="h-5 w-5 text-orange-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-text)]">
          <Bell className="h-6 w-6" />
          Bildirimler
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-medium text-white">
              {unreadCount} yeni
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 rounded-md bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors"
          >
            <Check className="h-4 w-4" />
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-[var(--color-text-muted)]/50" />
          <h3 className="mt-4 text-lg font-medium text-[var(--color-text)]">Henüz bildiriminiz bulunmuyor.</h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Yeni bir bildirim aldığınızda burada görünecektir.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          {notifications.map((notification) => {
            const content = (
              <div
                className={`flex items-start gap-4 p-4 transition-colors ${
                  notification.is_read ? 'bg-transparent hover:bg-[var(--color-surface-hover)]' : 'bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10'
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    handleMarkAsRead(notification.id)
                  }
                }}
              >
                <div className="mt-1 shrink-0 rounded-full bg-white p-2 shadow-sm ring-1 ring-[var(--color-border)]">
                  {getIcon(notification.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${notification.is_read ? 'font-medium text-[var(--color-text)]' : 'font-semibold text-[var(--color-text)]'}`}>
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: tr })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="shrink-0 pt-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                  </div>
                )}
              </div>
            )

            const link = (notification.metadata as { link?: string })?.link;

            if (link) {
              return (
                <Link key={notification.id} href={link} className="block">
                  {content}
                </Link>
              );
            }

            return (
              <div key={notification.id} className="cursor-pointer">
                {content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
