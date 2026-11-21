import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import Logo from '@/components/Logo';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Skin Analysis', to: '/dashboard/analysis' },
      { label: 'Image Enhancement', to: '/dashboard/enhance' },
      { label: 'Skincare Routine', to: '/dashboard/routine' },
      { label: 'AI Chatbot', to: '/dashboard/chatbot' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'Beauty Tips', to: '/dashboard/tips' },
      { label: 'Diet Planner', to: '/dashboard/diet' },
      { label: 'Analysis History', to: '/dashboard/history' },
      { label: 'Profile', to: '/dashboard/profile' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-navy-700 text-navy-100">
      <div className="container-app grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-200">
            Your Skin, Your Science, Your Confidence. Discover your skin and build a
            routine powered by AI.
          </p>
          <div className="mt-6 space-y-2.5 text-sm text-navy-200">
            <p className="flex items-center gap-2.5">
              <Mail className="h-4 w-4" /> hello@acne lyze.app
            </p>
            <p className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4" /> Built as a final-year capstone project
            </p>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-navy-200 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Legal</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-navy-200">
            <li><Link to="/legal/privacy" className="transition-colors hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/legal/terms" className="transition-colors hover:text-white">Terms of Service</Link></li>
            <li><Link to="/legal/disclaimer" className="transition-colors hover:text-white">Medical Disclaimer</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-600">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-5 text-xs text-navy-300 sm:flex-row">
          <p>© {new Date().getFullYear()} AcneLyze. All rights reserved.</p>
          <p>
            AcneLyze provides skincare guidance only and is not a medical device. It does
            not diagnose or treat any condition.
          </p>
        </div>
      </div>
    </footer>
  );
}
