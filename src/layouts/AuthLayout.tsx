import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

const SIDE_IMG =
  'https://images.pexels.com/photos/3762764/pexels-photo-3762764.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-700 text-white">
            <Sparkles className="h-4.5 w-4.5" strokeWidth={2.2} />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-navy-700">
            DermaLens
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <h1 className="text-3xl tracking-tight text-navy-700">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-navy-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-sm text-navy-500">{footer}</div>}
          </div>
        </div>
      </div>

      {/* Image side */}
      <div className="relative hidden lg:block">
        <img
          src={SIDE_IMG}
          alt="Close-up portrait with healthy skin"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-800/80 via-navy-800/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="font-serif text-2xl">Your Skin, Your Science, Your Confidence.</p>
          <p className="mt-2 text-sm text-navy-100">
            AI-guided skincare routines, analysis and daily care.
          </p>
        </div>
      </div>
    </div>
  );
}
