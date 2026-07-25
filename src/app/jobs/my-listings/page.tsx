import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import MyListingsClient from './my-listings-client'

export const metadata = {
  title: 'İlanlarım',
}

export default async function MyListingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
    
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'employer' && profile?.role !== 'admin' && profile?.role !== 'moderator') {
    redirect('/dashboard')
  }
  
  // Fetch employer's jobs with application count
  const { data: jobs } = await supabase
    .from('job_listings')
    .select(`
      *,
      job_applications(count)
    `)
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })
    
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16">
        <MyListingsClient initialJobs={jobs || []} />
      </main>
    </div>
  )
}
