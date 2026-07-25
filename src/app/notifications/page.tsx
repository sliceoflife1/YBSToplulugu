import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import NotificationsClient from './notifications-client'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <NotificationsClient notifications={notifications || []} userId={user.id} />
      </div>
    </main>
  )
}
