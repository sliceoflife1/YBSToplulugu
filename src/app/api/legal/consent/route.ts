import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { logActivity } from "@/lib/activity-logger"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    // Aktif yasal doküman versiyonlarını al
    const { data: activeVersions, error: versionsError } = await supabase
      .from('legal_document_versions')
      .select('document_type, current_version, title')
      .eq('is_active', true)

    if (versionsError) {
      console.error('Versions fetch error:', versionsError)
      return NextResponse.json({ error: 'Yasal metin versiyonları alınamadı.' }, { status: 500 })
    }

    if (!activeVersions || activeVersions.length === 0) {
      return NextResponse.json({ requiredConsents: [] })
    }

    // Kullanıcının onaylarını al
    const { data: userConsents, error: consentsError } = await supabase
      .from('user_legal_consents')
      .select('document_type, version')
      .eq('user_id', user.id)

    if (consentsError) {
      console.error('Consents fetch error:', consentsError)
      return NextResponse.json({ error: 'Kullanıcı onayları alınamadı.' }, { status: 500 })
    }

    const requiredConsents = activeVersions.filter(av => {
      const userConsent = userConsents?.find(uc => uc.document_type === av.document_type && uc.version === av.current_version)
      return !userConsent;
    })

    return NextResponse.json({ requiredConsents })
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

    const body = await request.json()
    const { consents } = body 

    if (!consents || !Array.isArray(consents) || consents.length === 0) {
      return NextResponse.json({ error: 'Onay verisi bulunamadı.' }, { status: 400 })
    }

    const headersList = await headers()
    const ip_address = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Bilinmiyor'
    const user_agent = headersList.get('user-agent') || 'Bilinmiyor'

    const inserts = consents.map(c => ({
      user_id: user.id,
      document_type: c.document_type,
      version: c.version,
      ip_address,
      user_agent
    }))

    const { error: insertError } = await supabase
      .from('user_legal_consents')
      .insert(inserts)

    if (insertError) {
      console.error('Consent insert error:', insertError)
      logActivity({
        userId: user.id,
        actionType: "legal.consent_given",
        actionCategory: "legal",
        entityType: "consent",
        status: "error",
        metadata: { error: insertError.message },
        request
      })
      return NextResponse.json({ error: 'Onaylar kaydedilemedi.' }, { status: 500 })
    }

    logActivity({
      userId: user.id,
      actionType: "legal.consent_given",
      actionCategory: "legal",
      entityType: "consent",
      status: "success",
      request
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
