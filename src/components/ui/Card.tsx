import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-navy-100 bg-white shadow-card ${
        hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: 'powder' | 'lavender' | 'peach';
}

const accentBg = {
  powder: 'bg-powder-100 text-navy-600',
  lavender: 'bg-lavender-100 text-lavender-500',
  peach: 'bg-peach-100 text-peach-400',
};

export function StatCard({ icon, label, value, accent = 'powder' }: StatCardProps) {
  return (
    <Card hover className="p-5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accentBg[accent]}`}>
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-navy-700">{value}</p>
    </Card>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-mist px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-navy-400 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-navy-700">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-navy-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
