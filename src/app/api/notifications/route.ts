import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unread_count = searchParams.get('unread_count')

    if (unread_count === 'true') {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Notification count error:', error)
        return NextResponse.json({ error: 'Bildirim sayısı alınamadı.' }, { status: 500 })
      }

      return NextResponse.json({ count: count || 0 })
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Notifications fetch error:', error)
      return NextResponse.json({ error: 'Bildirimler getirilemedi.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const body = await request.json()
    const { id, mark_all } = body

    if (mark_all) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Mark all notifications read error:', error)
        return NextResponse.json({ error: 'Bildirimler güncellenemedi.' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: 'id veya mark_all gereklidir.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('recipient_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Notification update error:', error)
      return NextResponse.json({ error: 'Bildirim güncellenemedi.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
