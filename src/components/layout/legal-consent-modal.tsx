'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type RequiredConsent = {
  document_type: string
  current_version: string
  title: string
}

export default function LegalConsentModal() {
  const [requiredConsents, setRequiredConsents] = useState<RequiredConsent[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkConsents = async () => {
      try {
        const res = await fetch('/api/legal/consent')
        if (res.ok) {
          const data = await res.json()
          if (data.requiredConsents && data.requiredConsents.length > 0) {
            setRequiredConsents(data.requiredConsents)
            setIsOpen(true)
          }
        }
      } catch (error) {
        console.error('Yasal onaylar kontrol edilirken hata oluştu:', error)
      } finally {
        setLoading(false)
      }
    }

    checkConsents()
  }, [])

  const handleSubmit = async () => {
    if (!agreed) return

    setSubmitting(true)
    try {
      const consents = requiredConsents.map(c => ({
        document_type: c.document_type,
        version: c.current_version
      }))

      const res = await fetch('/api/legal/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ consents })
      })

      if (res.ok) {
        setIsOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Bir hata oluştu.')
      }
    } catch (error) {
      console.error('Onay gönderilirken hata oluştu:', error)
      alert('Onay gönderilirken beklenmeyen bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full m-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-amber-500">⚠️</span> Yasal Metinlerimiz Güncellenmiştir
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          Platformumuzu kullanmaya devam edebilmek için lütfen güncellenen yasal metinleri inceleyip onaylayınız.
        </p>

        <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {requiredConsents.map((consent) => {
              let href = '#'
              switch (consent.document_type) {
                case 'kvkk': href = '/kvkk'; break;
                case 'terms': href = '/terms'; break;
                case 'privacy': href = '/privacy'; break;
                case 'cookies': href = '/cookies'; break;
              }
              return (
                <li key={consent.document_type}>
                  <Link href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    {consent.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mb-6 flex items-start gap-3">
          <input
            type="checkbox"
            id="legal-consent-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <label htmlFor="legal-consent-checkbox" className="text-sm text-gray-600 dark:text-gray-300">
            Güncellenen Kullanım Koşulları, KVKK Aydınlatma Metni ve Gizlilik Politikası'nı okudum, kabul ediyorum.
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!agreed || submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Onaylanıyor...' : 'Onayla ve Devam Et'}
        </button>
      </div>
    </div>
  )
}
