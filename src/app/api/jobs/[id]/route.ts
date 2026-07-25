import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('job_listings')
      .select('*, organizations(*), profiles(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Job listing fetch error:', error)
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    // Profil ve mevcut ilan
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: job } = await supabase
      .from('job_listings')
      .select('employer_id')
      .eq('id', id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 })
    }

    const isOwner = job.employer_id === user.id
    const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Bu işlemi yapmaya yetkiniz yok.' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, category, employment_type, work_mode, location, requirements, deadline, is_active } = body

    const { data, error } = await supabase
      .from('job_listings')
      .update({
        title, description, category, employment_type, work_mode, location, requirements, deadline, is_active
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Job listing update error:', error)
      return NextResponse.json({ error: 'İlan güncellenemedi.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
      .eq('id', id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 })
    }

    const isOwner = job.employer_id === user.id
    const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Bu işlemi yapmaya yetkiniz yok.' }, { status: 403 })
    }

    const { error } = await supabase
      .from('job_listings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Job listing delete error:', error)
      return NextResponse.json({ error: 'İlan silinemedi.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
