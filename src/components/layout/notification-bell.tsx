'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications?unread_count=true');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Bildirimler alınamadı', error);
      }
    };

    fetchUnreadCount();
    
    // 30 saniyede bir polling
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <button 
      onClick={() => router.push('/notifications')}
      className="relative p-2 rounded-full hover:bg-[var(--color-muted)] transition-colors"
      aria-label="Bildirimler"
    >
      <Bell className="w-6 h-6 text-[var(--color-foreground)]" />
      
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-error)] text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--color-background)] animate-in zoom-in duration-300">
          {displayCount}
        </span>
      )}
    </button>
  );
}
