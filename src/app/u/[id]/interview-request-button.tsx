'use client'

import { useState } from 'react'
import { Handshake, Check } from 'lucide-react'
import { toast } from 'sonner'

interface InterviewRequestButtonProps {
  recipientId: string
  recipientName: string
}

export default function InterviewRequestButton({ recipientId, recipientName }: InterviewRequestButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSendRequest = async () => {
    if (isSent || isSending) return

    setIsSending(true)
    try {
      const response = await fetch('/api/notifications/interview-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient_id: recipientId }),
      })

      if (!response.ok) {
        throw new Error('İstek gönderilemedi')
      }

      setIsSent(true)
      toast.success(`${recipientName} adlı kullanıcıya görüşme isteği gönderildi.`)
    } catch (error) {
      toast.error('Bildirim gönderilirken bir hata oluştu.')
    } finally {
      setIsSending(false)
    }
  }

  if (isSent) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 cursor-not-allowed border border-emerald-500/20"
      >
        <Check className="h-4 w-4" />
        Bildirim Gönderildi ✓
      </button>
    )
  }

  return (
    <button
      onClick={handleSendRequest}
      disabled={isSending}
      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <Handshake className="h-4 w-4" />
      {isSending ? 'Gönderiliyor...' : 'İş Görüşmesi İçin Bildirim Gönder'}
    </button>
  )
}
