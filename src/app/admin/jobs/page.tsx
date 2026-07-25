import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import AdminJobsClient from './client'
import { JobListing } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Admin/Mod kontrolü
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator', 'faculty'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch all jobs including organization and profile info
  const { data: jobs, error } = await supabase
    .from('job_listings')
    .select(`
      *,
      organization:organization_id (*),
      profile:user_id (*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <AdminJobsClient listings={(jobs as any) || []} />
      </div>
    </main>
  )
}
