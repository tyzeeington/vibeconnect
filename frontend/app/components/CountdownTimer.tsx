'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string | null;
  isExpired: boolean;
  timeRemainingHours?: number | null;
}

export function CountdownTimer({ expiresAt, isExpired, timeRemainingHours }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeRemainingHours || 0);

  useEffect(() => {
    if (!expiresAt || isExpired) return;

    // Update countdown every minute
    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(diff / (1000 * 60 * 60)); // Convert to hours
      }
    }, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt, isExpired]);

  if (isExpired) {
    return (
      <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-semibold flex items-center gap-2">
        <span>⏰</span>
        EXPIRED
      </span>
    );
  }

  if (!timeRemaining || timeRemaining <= 0) {
    return null;
  }

  const days = Math.floor(timeRemaining / 24);
  const hours = Math.floor(timeRemaining % 24);
  const minutes = Math.floor((timeRemaining % 1) * 60);

  // Determine urgency level
  let urgencyClass = 'bg-green-500/20 text-green-300';
  if (timeRemaining < 12) {
    urgencyClass = 'bg-red-500/20 text-red-300';
  } else if (timeRemaining < 24) {
    urgencyClass = 'bg-yellow-500/20 text-yellow-300';
  } else if (timeRemaining < 48) {
    urgencyClass = 'bg-orange-500/20 text-orange-300';
  }

  return (
    <span className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${urgencyClass}`}>
      <span>⏰</span>
      {days > 0 ? (
        <span>{days}d {hours}h remaining</span>
      ) : hours > 0 ? (
        <span>{hours}h {minutes}m remaining</span>
      ) : (
        <span className="animate-pulse">{minutes}m remaining - Act fast!</span>
      )}
    </span>
  );
}
