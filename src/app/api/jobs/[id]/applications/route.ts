import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: job_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: job } = await supabase
      .from('job_listings')
      .select('employer_id')
      .eq('id', job_id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 })
    }

    const isOwner = job.employer_id === user.id
    const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Bu ilanın başvurularını görme yetkiniz yok.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('job_applications')
      .select('*, profiles(*)')
      .eq('job_listing_id', job_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Job applications fetch error:', error)
      return NextResponse.json({ error: 'Başvurular getirilemedi.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: job_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: job } = await supabase
      .from('job_listings')
      .select('employer_id')
      .eq('id', job_id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 })
    }

    const isOwner = job.employer_id === user.id
    const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 })
    }

    const body = await request.json()
    const { application_id, status } = body

    if (!application_id || !status) {
      return NextResponse.json({ error: 'application_id ve status gereklidir.' }, { status: 400 })
    }

    if (!['reviewed', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum (status).' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', application_id)
      .eq('job_listing_id', job_id)
      .select()
      .single()

    if (error) {
      console.error('Job application update error:', error)
      return NextResponse.json({ error: 'Başvuru durumu güncellenemedi.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
