'use client';

import { useEffect, useState } from 'react';

export default function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (isExpired) {
    return (
      <div className="text-[var(--color-error)] font-semibold text-center p-4 bg-[var(--color-error)]/10 rounded-lg">
        Başvuru süresi doldu
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 justify-center transition-all duration-300">
      {[
        { label: 'Gün', value: timeLeft.days },
        { label: 'Saat', value: timeLeft.hours },
        { label: 'Dakika', value: timeLeft.minutes },
        { label: 'Saniye', value: timeLeft.seconds },
      ].map((item, index) => (
        <div key={index} className="flex flex-col items-center justify-center bg-[var(--color-muted)] border border-[var(--color-border)] rounded-lg w-16 h-16 shadow-sm">
          <span className="text-xl font-bold text-[var(--color-foreground)]">{item.value.toString().padStart(2, '0')}</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
