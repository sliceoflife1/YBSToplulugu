import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import Link from 'next/link'
import { Calendar, Building, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { JOB_CATEGORY_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/constants/job-categories'

export const metadata = {
  title: 'Başvurularım',
}

export default async function MyApplicationsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
    
  // Fetch applications with job and organization details
  const { data: applications } = await supabase
    .from('job_applications')
    .select(`
      *,
      job_listings (
        title,
        category,
        employment_type,
        deadline,
        is_active,
        organizations (
          name,
          logo_url
        )
      )
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })
    
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-3 h-3 mr-1" /> Beklemede</span>
      case 'reviewed':
        return <span className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><FileText className="w-3 h-3 mr-1" /> İncelendi</span>
      case 'accepted':
        return <span className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Kabul</span>
      case 'rejected':
        return <span className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" /> Red</span>
      default:
        return <span className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Bilinmiyor</span>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Başvurularım</h1>
          <p className="text-muted-foreground mt-2">
            İş ve staj ilanlarına yaptığınız tüm başvurular.
          </p>
        </div>

        {!applications || applications.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Henüz bir başvurunuz bulunmuyor</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Kariyerinize uygun ilanları inceleyerek ilk başvurunuzu yapabilirsiniz.
            </p>
            <Link 
              href="/jobs" 
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              İlanları İncele
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app: any) => {
              const job = app.job_listings
              const org = job?.organizations
              const categoryLabel = JOB_CATEGORY_LABELS[job?.category as keyof typeof JOB_CATEGORY_LABELS] || job?.category
              
              return (
                <div key={app.id} className="bg-card rounded-xl border shadow-sm p-4 sm:p-6 transition-all hover:shadow-md">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    
                    <div className="flex gap-4">
                      {/* Logo or Placeholder */}
                      <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted overflow-hidden">
                        {org?.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover" />
                        ) : (
                          <Building className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link 
                            href={`/jobs/${app.job_id}`}
                            className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
                          >
                            {job?.title || 'İlan Silinmiş'}
                          </Link>
                          {job?.is_active === false && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Pasif
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                          <span className="font-medium">{org?.name || 'Bilinmeyen Şirket'}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-secondary px-2 py-1 rounded-md">
                            {categoryLabel}
                          </span>
                          <span className="bg-secondary px-2 py-1 rounded-md">
                            {EMPLOYMENT_TYPE_LABELS[job?.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS] || job?.employment_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 gap-2">
                      <div className="flex flex-col sm:items-end gap-1">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Başvuru: {new Date(app.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                    
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
