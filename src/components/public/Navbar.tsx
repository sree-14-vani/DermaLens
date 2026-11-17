import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { to: '/#features', label: 'Features' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#why-us', label: 'Why Us' },
  { to: '/#testimonials', label: 'Testimonials' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (to: string) => {
    setOpen(false);
    if (to.includes('#')) {
      const id = to.split('#')[1];
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/90 shadow-sm backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="container-app flex h-16 items-center justify-between sm:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <button
              key={l.to}
              onClick={() => goTo(l.to)}
              className="text-sm font-medium text-navy-500 transition-colors hover:text-navy-700"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button onClick={() => navigate('/dashboard')}>Open Dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button onClick={() => navigate('/register')}>Get Started</Button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-navy-700 hover:bg-mist md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-100 bg-white px-4 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <button
                key={l.to}
                onClick={() => goTo(l.to)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy-600 hover:bg-mist"
              >
                {l.label}
              </button>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>Open Dashboard</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    Log in
                  </Button>
                  <Button onClick={() => navigate('/register')}>Get Started</Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
