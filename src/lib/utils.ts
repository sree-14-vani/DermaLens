import type { HTMLAttributes } from 'react';

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const severityLabels: Record<string, string> = {
  mild: 'Mild acne',
  moderate: 'Moderate acne',
  severe: 'Severe acne',
  very_severe: 'Very severe acne',
};

export type { HTMLAttributes };
