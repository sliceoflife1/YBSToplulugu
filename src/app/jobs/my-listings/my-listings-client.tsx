'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Eye, Calendar, Users, Briefcase } from 'lucide-react'
import { JOB_CATEGORY_LABELS } from '@/constants/job-categories'
import type { JobListing } from '@/types/database'

// Extended type for jobs with application count
type JobWithCount = JobListing & {
  job_applications: [{ count: number }] | { count: number }[]
}

export default function MyListingsClient({ initialJobs }: { initialJobs: any[] }) {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>(initialJobs)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      
      if (!response.ok) throw new Error('Güncelleme başarısız')
      
      // Update local state
      setJobs(jobs.map(job => 
        job.id === id ? { ...job, is_active: !currentStatus } : job
      ))
      
      toast.success(`İlan ${!currentStatus ? 'aktif' : 'pasif'} duruma getirildi`)
      router.refresh()
    } catch (error) {
      toast.error('İlan durumu güncellenirken bir hata oluştu')
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return
    
    setIsDeleting(id)
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Silme başarısız')
      
      // Update local state
      setJobs(jobs.filter(job => job.id !== id))
      toast.success('İlan başarıyla silindi')
      router.refresh()
    } catch (error) {
      toast.error('İlan silinirken bir hata oluştu')
    } finally {
      setIsDeleting(null)
    }
  }

  const getApplicationCount = (job: any) => {
    if (!job.job_applications) return 0;
    if (Array.isArray(job.job_applications) && job.job_applications.length > 0) {
      return job.job_applications[0].count;
    }
    return 0;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">İlanlarım</h1>
          <p className="text-muted-foreground mt-1">
            Yayınladığınız iş ve staj ilanlarını buradan yönetebilirsiniz.
          </p>
        </div>
        <Link 
          href="/jobs/create" 
          className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni İlan Oluştur
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed p-12 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Henüz ilanınız yok</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Yeni takım arkadaşları veya stajyerler bulmak için ilk ilanınızı oluşturun.
          </p>
          <Link 
            href="/jobs/create" 
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            İlan Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-card rounded-xl border shadow-sm p-4 sm:p-6 transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.is_active 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {job.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1.5" />
                      {JOB_CATEGORY_LABELS[job.category as keyof typeof JOB_CATEGORY_LABELS] || job.category}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      {new Date(job.created_at).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="flex items-center text-primary font-medium">
                      <Users className="h-4 w-4 mr-1.5" />
                      {getApplicationCount(job)} Başvuru
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:self-start">
                  <button
                    onClick={() => handleToggleActive(job.id, job.is_active)}
                    className="px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-muted transition-colors whitespace-nowrap"
                  >
                    {job.is_active ? 'Pasife Al' : 'Aktifleştir'}
                  </button>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    title="Görüntüle"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/jobs/${job.id}/edit`}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    title="Düzenle"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={isDeleting === job.id}
                    className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-md transition-colors disabled:opacity-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
