import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Logo({ to = '/', dark = false }: { to?: string; dark?: boolean }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${dark ? 'bg-white/10' : 'bg-navy-700'} text-white`}>
        <Sparkles className="h-4.5 w-4.5" strokeWidth={2.2} />
      </span>
      <span className={`font-serif text-xl font-semibold tracking-tight ${dark ? 'text-white' : 'text-navy-700'}`}>
        AcneLyze
      </span>
    </Link>
  );
}
