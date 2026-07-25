import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    // Yetki kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'employer') {
      return NextResponse.json({ error: 'Sadece işverenler görüşme talebi gönderebilir.' }, { status: 403 })
    }

    const body = await request.json()
    const { recipient_id } = body

    if (!recipient_id) {
      return NextResponse.json({ error: 'Alıcı ID (recipient_id) gereklidir.' }, { status: 400 })
    }

    // Organizasyon bilgisi
    const { data: organization } = await supabase
      .from('organizations')
      .select('id, name, approval_status')
      .eq('owner_id', user.id)
      .eq('approval_status', 'approved')
      .single()

    if (!organization) {
      return NextResponse.json({ error: 'Onaylı bir organizasyonunuz bulunmuyor.' }, { status: 403 })
    }

    // Hedef profil kontrolü (isteğe bağlı güvenlik için)
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', recipient_id)
      .single()

    if (!recipientProfile) {
      return NextResponse.json({ error: 'Hedef kullanıcı bulunamadı.' }, { status: 404 })
    }

    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase.from('notifications').insert({
      type: 'interview_request',
      recipient_id: recipient_id,
      title: `${organization.name} sizinle görüşmek istiyor`,
      message: `${organization.name}, iş görüşmesi veya staj için sizinle görüşmek istiyor. Bu şirket ile görüşmek istiyorsanız şirketin iletişim kanallarıyla ya da aktif iş ilanlarıyla başvuru yapabilirsiniz.`,
      metadata: {
        organization_id: organization.id,
        organization_name: organization.name,
        employer_id: user.id
      }
    }).select().single()

    if (error) {
      console.error('Interview request notification error:', error)
      return NextResponse.json({ error: 'Görüşme talebi gönderilemedi.' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
