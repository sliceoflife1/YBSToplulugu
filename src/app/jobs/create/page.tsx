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
  
  // Get employer's organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'approved')
    .single()
    
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
        
        {!organization && profile?.role === 'employer' ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Onaylı Organizasyon Bulunamadı</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              İş ilanı yayınlayabilmek için onaylanmış bir şirket veya topluluk hesabınızın olması gerekmektedir.
            </p>
            <Link 
              href="/organizations/create" 
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Organizasyon Başvurusu Yap
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <CreateForm employerId={user.id} organizationId={organization?.id} />
          </div>
        )}
      </main>
    </div>
  )
}
