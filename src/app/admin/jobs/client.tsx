'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Briefcase, Search, MoreVertical, Edit, Eye, Trash2, ShieldAlert } from 'lucide-react'
import type { JobListing } from '@/types/database'
import { toast } from 'sonner'
import Link from 'next/link'
import { JOB_CATEGORY_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/constants/job-categories'

interface AdminJobsClientProps {
  listings: (JobListing & { organization?: any; profile?: any })[]
}

export default function AdminJobsClient({ listings: initialListings }: AdminJobsClientProps) {
  const [listings, setListings] = useState(initialListings)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filteredListings = listings.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          (job.organization?.name || '').toLowerCase().includes(search.toLowerCase())
    
    if (statusFilter === 'active') return matchesSearch && job.is_active
    if (statusFilter === 'inactive') return matchesSearch && !job.is_active
    return matchesSearch
  })

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (!response.ok) throw new Error('Durum güncellenemedi')

      setListings(prev => prev.map(job => 
        job.id === id ? { ...job, is_active: !currentStatus } : job
      ))
      toast.success(currentStatus ? 'İlan pasife alındı.' : 'İlan aktif edildi.')
    } catch (error) {
      toast.error('İşlem başarısız oldu.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('İlan silinemedi')

      setListings(prev => prev.filter(job => job.id !== id))
      toast.success('İlan başarıyla silindi.')
      setDeleteConfirmId(null)
    } catch (error) {
      toast.error('Silme işlemi başarısız oldu.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-text)]">
          <Briefcase className="h-7 w-7 text-[var(--color-primary)]" />
          İş İlanları Yönetimi
        </h1>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="İlan veya şirket ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-4 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:w-64"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-3 pr-8 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif İlanlar</option>
            <option value="inactive">Pasif İlanlar</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--color-text)]">
            <thead className="bg-[var(--color-surface-hover)] text-xs font-medium uppercase text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4">İlan Başlığı</th>
                <th className="px-6 py-4">Şirket</th>
                <th className="px-6 py-4">Kategori / Tip</th>
                <th className="px-6 py-4 text-center">Durum</th>
                <th className="px-6 py-4 text-center">Tarih</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    Kriterlere uygun ilan bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredListings.map((job) => (
                  <tr key={job.id} className="hover:bg-[var(--color-surface-hover)]">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--color-text)]">{job.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {job.organization?.logo_url ? (
                          <img src={job.organization.logo_url} alt="" className="h-6 w-6 rounded-md object-cover" />
                        ) : (
                          <div className="h-6 w-6 rounded-md bg-[var(--color-border)] flex items-center justify-center">
                            <Briefcase className="h-3 w-3 text-[var(--color-text-muted)]" />
                          </div>
                        )}
                        <span>{job.organization?.name || 'Bilinmeyen Şirket'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">{JOB_CATEGORY_LABELS[job.category as keyof typeof JOB_CATEGORY_LABELS] || job.category}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{EMPLOYMENT_TYPE_LABELS[job.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS] || job.employment_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        job.is_active 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {job.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[var(--color-text-muted)] text-xs">
                      {format(new Date(job.created_at), 'd MMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/jobs/${job.id}/edit`}
                          className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => toggleStatus(job.id, job.is_active)}
                          className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition-colors text-xs font-medium"
                          title={job.is_active ? 'Pasife Al' : 'Aktif Et'}
                        >
                          {job.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(job.id)}
                          className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">İlanı Sil</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve ilanla ilişkili başvurular da silinebilir.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
