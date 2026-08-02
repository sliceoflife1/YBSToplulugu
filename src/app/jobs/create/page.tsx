import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import CreateForm from './create-form'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Yeni İş İlanı Oluştur',
}

export default async function CreateJobPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
    
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'employer') {
    redirect('/dashboard')
  }
  
  // Get employer's organization (must be approved)
  const { data: approvedOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .eq('approval_status', 'approved')
    .maybeSingle()

  const { data: anyOrg } = approvedOrg
    ? { data: approvedOrg }
    : await supabase
        .from('organizations')
        .select('id, approval_status, name')
        .eq('owner_id', user.id)
        .maybeSingle()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl mt-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Yeni İş İlanı Oluştur</h1>
          <Link 
            href="/jobs" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            İlanlara Dön
          </Link>
        </div>
        
        {!approvedOrg && profile?.role === 'employer' ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {anyOrg?.approval_status === 'pending'
                ? 'Organizasyonunuz Admin Onayındadır'
                : 'Onaylı Organizasyon Bulunamadı'}
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              {anyOrg?.approval_status === 'pending'
                ? `${anyOrg.name || 'Şirket'} başvurunuz yönetici onayındadır. Onaylandıktan sonra iş ilanı yayınlayabilirsiniz.`
                : 'İş ilanı yayınlayabilmek için onaylanmış bir şirket veya topluluk hesabınızın olması gerekmektedir.'}
            </p>
            <Link 
              href="/profile/edit" 
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Şirket / Kuruluş Bilgilerini Düzenle
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <CreateForm employerId={user.id} organizationId={approvedOrg?.id} />
          </div>
        )}
      </main>
    </div>
  )
}
