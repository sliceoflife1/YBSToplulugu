import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/activity-logger"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: job_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    // Profil bilgisi (ad soyad için)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const applicant_name = profile?.full_name || 'Bilinmeyen Kullanıcı'

    // İlan kontrolü
    const { data: job } = await supabase
      .from('job_listings')
      .select('*, organizations(name)')
      .eq('id', job_id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 })
    }

    if (!job.is_active) {
      return NextResponse.json({ error: 'Bu ilan aktif değil.' }, { status: 400 })
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return NextResponse.json({ error: 'İlanın son başvuru tarihi geçmiş.' }, { status: 400 })
    }

    // CV kontrolü
    const { data: cvRecord } = await supabase
      .from('cv_data')
      .select('id, education, skills')
      .eq('user_id', user.id)
      .single()

    if (!cvRecord) {
      return NextResponse.json({ error: 'CV veriniz bulunamadı. Lütfen CV sayfasından bilgilerinizi doldurun.' }, { status: 400 })
    }

    // Temel CV alanları doğrulaması
    const missingFields: string[] = []
    const education = cvRecord.education as unknown[]
    const skills = cvRecord.skills as unknown[]

    if (!education || !Array.isArray(education) || education.length === 0) {
      missingFields.push('Eğitim bilgisi')
    }
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      missingFields.push('Yetenek/beceri bilgisi')
    }

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `CV'nizde eksik bilgiler var: ${missingFields.join(', ')}. Lütfen CV sayfasından bu bilgileri tamamlayın.`
      }, { status: 400 })
    }

    // Başvuru kaydı oluştur
    const { data: application, error: applyError } = await supabase
      .from('job_applications')
      .insert({
        job_listing_id: job_id,
        applicant_id: user.id,
        status: 'pending'
      })
      .select()
      .single()

    if (applyError) {
      if (applyError.code === '23505') { // unique constraint
        return NextResponse.json({ error: 'Bu ilana daha önce başvurdunuz.' }, { status: 400 })
      }
      console.error('Job apply error:', applyError)
      logActivity({
        userId: user.id,
        actionType: "job.apply",
        actionCategory: "job",
        entityType: "job_application",
        status: "error",
        metadata: { error: applyError.message, jobId: job_id },
        request
      })
      return NextResponse.json({ error: 'Başvuru yapılamadı.' }, { status: 500 })
    }

    // Bildirimler (adminClient ile RLS bypass)
    try {
      const adminSupabase = createAdminClient()

      // 1. İşverene bildirim
      await adminSupabase.from('notifications').insert({
        type: 'job_application',
        recipient_id: job.employer_id,
        title: `Yeni Başvuru: ${job.title}`,
        message: `${applicant_name} adlı kullanıcı "${job.title}" ilanınıza başvurdu.`,
        metadata: { job_listing_id: job_id, applicant_id: user.id, applicant_name }
      })

      // 2. Öğrenciye bildirim
      await adminSupabase.from('notifications').insert({
        type: 'application_success',
        recipient_id: user.id,
        title: 'Başvurunuz Alındı',
        message: `"${job.title}" ilanına başvurunuz başarıyla tamamlandı. CV içeriğinizde yer alan iletişim bilgilerinden işverenler sizinle iletişime geçebilecektir.`,
        metadata: { job_listing_id: job_id }
      })
    } catch (notifErr) {
      console.error('Notification dispatch error:', notifErr)
    }

    logActivity({
      userId: user.id,
      actionType: "job.apply",
      actionCategory: "job",
      entityType: "job_application",
      entityId: application.id,
      status: "success",
      metadata: { jobId: job_id },
      request
    })

    return NextResponse.json({ data: application }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
