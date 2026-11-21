import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanFace,
  Wand2,
  ListChecks,
  Sparkles,
  Salad,
  MessageCircle,
  History,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/analysis', label: 'Skin Analysis', icon: ScanFace },
  { to: '/dashboard/enhance', label: 'Image Enhancement', icon: Wand2 },
  { to: '/dashboard/routine', label: 'Skincare Routine', icon: ListChecks },
  { to: '/dashboard/tips', label: 'Beauty Tips', icon: Sparkles },
  { to: '/dashboard/diet', label: 'Diet Planner', icon: Salad },
  { to: '/dashboard/chatbot', label: 'AI Chatbot', icon: MessageCircle },
  { to: '/dashboard/history', label: 'Analysis History', icon: History },
  { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-700 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
            <path d="M12 3c-4 0-8 3.6-8 9s4 9 8 9 8-3.6 8-9-4-9-8-9z" />
          </svg>
        </span>
        <span className="font-serif text-lg font-semibold text-white">AcneLyze</span>
      </div>

      <nav className="thin-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-navy-200 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-2 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-peach-100 text-sm font-bold text-navy-700">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.email}</p>
            <p className="text-xs text-navy-300">Signed in</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mist">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-700 lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-navy-700 px-4 lg:hidden">
        <span className="font-serif text-lg font-semibold text-white">AcneLyze</span>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-800/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-navy-700 shadow-card-hover">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-navy-200 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
