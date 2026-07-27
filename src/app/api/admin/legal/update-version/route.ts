import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/activity-logger"

export async function POST(request: Request) {
  try {
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
    }

    const body = await request.json()
    const { document_type, new_version, title } = body

    if (!document_type || !new_version || !title) {
      return NextResponse.json({ error: 'document_type, new_version ve title alanları zorunludur.' }, { status: 400 })
    }

    // Diğer versiyonları is_active = false yap
    await supabase
      .from('legal_document_versions')
      .update({ is_active: false })
      .eq('document_type', document_type)

    // Yeni versiyonu ekle veya güncelle
    const { error: upsertError } = await supabase
      .from('legal_document_versions')
      .upsert({
        document_type,
        current_version: new_version,
        title,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'document_type' })

    if (upsertError) {
      console.error('Update version error:', upsertError)
      logActivity({
        userId: user.id,
        actionType: "admin.legal_update",
        actionCategory: "admin",
        entityType: "legal_document",
        status: "error",
        metadata: { error: upsertError.message },
        request
      })
      return NextResponse.json({ error: 'Versiyon güncellenemedi.' }, { status: 500 })
    }

    // Aktif profilleri bul ve bildirim at
    const { data: activeProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError)
      return NextResponse.json({ success: true, warning: 'Versiyon güncellendi fakat bildirimler atılamadı.' })
    }

    if (activeProfiles && activeProfiles.length > 0) {
      const notifications = activeProfiles.map(p => ({
        recipient_id: p.id,
        type: 'system',
        content: 'Yasal metinlerimiz güncellendi. Kullanıma devam etmek için onayınız gerekmektedir.',
        is_read: false
      }))

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)
        
      if (notifError) {
         console.error('Notifications insert error:', notifError)
         return NextResponse.json({ success: true, warning: 'Versiyon güncellendi fakat bazı bildirimler atılamadı.' })
      }
    }

    logActivity({
      userId: user.id,
      actionType: "admin.legal_update",
      actionCategory: "admin",
      entityType: "legal_document",
      status: "success",
      metadata: { documentType: document_type, newVersion: new_version },
      request
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
