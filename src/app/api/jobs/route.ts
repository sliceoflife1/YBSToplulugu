import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const employment_type = searchParams.get('employment_type')
    const work_mode = searchParams.get('work_mode')
    const search = searchParams.get('search')

    let query = supabase
      .from('job_listings')
      .select('*, organizations(*), profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category) query = query.eq('category', category)
    if (employment_type) query = query.eq('employment_type', employment_type)
    if (work_mode) query = query.eq('work_mode', work_mode)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error } = await query

    if (error) {
      console.error('Job listings fetch error:', error)
      return NextResponse.json({ error: 'İlanlar getirilemedi.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    // Yetki kontrolü (employer rolü)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'employer') {
      return NextResponse.json({ error: 'Bu işlem için işveren yetkisine sahip olmalısınız.' }, { status: 403 })
    }

    // Organizasyon kontrolü
    const { data: organization } = await supabase
      .from('organizations')
      .select('id, approval_status')
      .eq('owner_id', user.id)
      .eq('approval_status', 'approved')
      .single()

    if (!organization) {
      return NextResponse.json({ error: 'Onaylı bir organizasyonunuz bulunmuyor. İlan vermek için organizasyon oluşturmalı ve onay almalısınız.' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, category, employment_type, work_mode, location, requirements, deadline } = body

    if (!title || !description || !category || !employment_type || !work_mode) {
      return NextResponse.json({ error: 'Gerekli alanları doldurunuz.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('job_listings')
      .insert({
        employer_id: user.id,
        organization_id: organization.id,
        title,
        description,
        category,
        employment_type,
        work_mode,
        location,
        requirements,
        deadline,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Job listing create error:', error)
      logActivity({
        userId: user.id,
        actionType: "job.create",
        actionCategory: "job",
        entityType: "job_listing",
        status: "error",
        metadata: { error: error.message },
        request
      })
      return NextResponse.json({ error: 'İlan oluşturulamadı.' }, { status: 500 })
    }

    logActivity({
      userId: user.id,
      actionType: "job.create",
      actionCategory: "job",
      entityType: "job_listing",
      entityId: data.id,
      status: "success",
      metadata: { title },
      request
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
