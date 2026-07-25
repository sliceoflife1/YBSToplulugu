import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import EditForm from './edit-form'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'İş İlanını Düzenle',
}

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
    
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  // Fetch job
  const { data: job } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', id)
    .single()
    
  if (!job) {
    notFound()
  }

  // Check authorization
  const isOwner = job.employer_id === user.id
  const isAdminOrModerator = profile?.role === 'admin' || profile?.role === 'moderator'
  
  if (!isOwner && !isAdminOrModerator) {
    redirect('/dashboard')
  }
    
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl mt-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">İlanı Düzenle</h1>
          <Link 
            href={`/jobs/${id}`} 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            İlana Dön
          </Link>
        </div>
        
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <EditForm job={job} />
        </div>
      </main>
    </div>
  )
}
