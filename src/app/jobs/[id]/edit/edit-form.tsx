'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { JOB_CATEGORIES, EMPLOYMENT_TYPES, WORK_MODES, JOB_CATEGORY_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from '@/constants/job-categories'
import { Plus, X, Loader2 } from 'lucide-react'
import type { JobListing } from '@/types/database'

export default function EditForm({ job }: { job: JobListing }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [requirements, setRequirements] = useState<string[]>(
    job.requirements && job.requirements.length > 0 ? job.requirements : ['']
  )
  const [isActive, setIsActive] = useState(job.is_active)
  
  const handleAddRequirement = () => {
    setRequirements([...requirements, ''])
  }
  
  const handleRemoveRequirement = (index: number) => {
    if (requirements.length > 1) {
      const newReqs = [...requirements]
      newReqs.splice(index, 1)
      setRequirements(newReqs)
    } else {
      setRequirements([''])
    }
  }
  
  const handleRequirementChange = (index: number, value: string) => {
    const newReqs = [...requirements]
    newReqs[index] = value
    setRequirements(newReqs)
  }

  // Format deadline for datetime-local input
  const formattedDeadline = job.deadline 
    ? new Date(job.deadline).toISOString().slice(0, 16)
    : ''

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      const payload = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        employment_type: formData.get('employment_type'),
        work_mode: formData.get('work_mode'),
        location: formData.get('location'),
        deadline: formData.get('deadline') || null,
        requirements: requirements.filter(req => req.trim() !== ''),
        is_active: isActive
      }
      
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error('İlan güncellenirken bir hata oluştu')
      }
      
      toast.success('İş ilanı başarıyla güncellendi')
      router.push(`/jobs/${job.id}`)
      router.refresh()
    } catch (error) {
      toast.error('Hata oluştu. Lütfen tekrar deneyin.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        
        {/* Is Active Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div>
            <p className="font-medium">İlan Durumu</p>
            <p className="text-sm text-muted-foreground">İlanı yayından kaldırmak için pasif duruma getirin.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ml-3 text-sm font-medium">
              {isActive ? 'Aktif' : 'Pasif'}
            </span>
          </label>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            İlan Başlığı <span className="text-error">*</span>
          </label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            required 
            defaultValue={job.title}
            className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Örn: Frontend Geliştirici"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            İlan Detayları
          </label>
          <textarea 
            id="description" 
            name="description" 
            rows={4}
            defaultValue={job.description || ''}
            className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="İşin tanımı, beklentiler, sorumluluklar..."
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Kategori <span className="text-error">*</span>
            </label>
            <select 
              id="category" 
              name="category" 
              required
              defaultValue={job.category}
              className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Seçiniz</option>
              {JOB_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {JOB_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="employment_type" className="block text-sm font-medium mb-1">
              Çalışma Tipi <span className="text-error">*</span>
            </label>
            <select 
              id="employment_type" 
              name="employment_type" 
              required
              defaultValue={job.employment_type}
              className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {EMPLOYMENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="work_mode" className="block text-sm font-medium mb-1">
              Çalışma Modu <span className="text-error">*</span>
            </label>
            <select 
              id="work_mode" 
              name="work_mode" 
              required
              defaultValue={job.work_mode}
              className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {WORK_MODES.map(mode => (
                <option key={mode} value={mode}>
                  {WORK_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              Konum
            </label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              defaultValue={job.location || ''}
              className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Örn: İstanbul, Türkiye"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Gereksinimler
          </label>
          <div className="space-y-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <input 
                  type="text" 
                  value={req}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Bir gereksinim ekleyin..."
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveRequirement(index)}
                  disabled={requirements.length === 1 && !requirements[0]}
                  className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={handleAddRequirement}
            className="mt-2 flex items-center text-sm text-primary font-medium hover:underline"
          >
            <Plus className="h-4 w-4 mr-1" /> Yeni Madde Ekle
          </button>
        </div>
        
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium mb-1">
            Son Başvuru Tarihi
          </label>
          <input 
            type="datetime-local" 
            id="deadline" 
            name="deadline" 
            defaultValue={formattedDeadline}
            className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button 
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg font-medium border hover:bg-muted transition-colors"
        >
          İptal
        </button>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Değişiklikleri Kaydet
        </button>
      </div>
    </form>
  )
}
