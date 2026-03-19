import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isOnline(lastSeen?: string) {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  // Consider online if seen in the last 5 minutes
  return (now.getTime() - lastSeenDate.getTime()) < 5 * 60 * 1000;
}
