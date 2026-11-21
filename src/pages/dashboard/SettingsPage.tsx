import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Lock, LogOut, Info, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-navy-700' : 'bg-navy-200'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [reminders, setReminders] = useState(true);
  const [hydration, setHydration] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  const persist = () => {
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-navy-400">Preferences, security and account actions.</p>
      </div>

      {savedNote && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Preferences saved
        </div>
      )}

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
          <Bell className="h-5 w-5 text-navy-500" /> Notifications
        </h2>
        <div className="mt-4 divide-y divide-navy-50">
          {[
            { label: 'Skincare routine reminders', desc: 'A nudge when your morning or night routine steps are pending.', value: reminders, set: setReminders },
            { label: 'Hydration reminders', desc: 'Gentle prompts to keep your water intake steady through the day.', value: hydration, set: setHydration },
            { label: 'Weekly progress summary', desc: 'A weekly digest of your checklist consistency and analyses.', value: weeklySummary, set: setWeeklySummary },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-navy-700">{row.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-navy-400">{row.desc}</p>
              </div>
              <Toggle
                on={row.value}
                onChange={(v) => {
                  row.set(v);
                  persist();
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
          <Moon className="h-5 w-5 text-navy-500" /> Appearance
        </h2>
        <div className="mt-4 flex items-center justify-between gap-6 py-1">
          <div>
            <p className="text-sm font-medium text-navy-700">Reduce motion</p>
            <p className="mt-0.5 text-xs text-navy-400">Minimizes scroll-reveal and hover movement across the app.</p>
          </div>
          <Toggle
            on={reduceMotion}
            onChange={(v) => {
              setReduceMotion(v);
              document.documentElement.classList.toggle('reduce-motion', v);
              persist();
            }}
          />
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
          <Lock className="h-5 w-5 text-navy-500" /> Security
        </h2>
        <div className="mt-4 space-y-3 text-sm text-navy-500">
          <p className="flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            Your session is stored by your browser's secure authentication flow — passwords are never kept in the app.
          </p>
          <p className="flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            Facial photos are stored privately and can only be viewed by your account.
          </p>
          <p className="flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            Use the "Forgot password" link on the sign-in page to reset your password by email.
          </p>
        </div>
      </Card>

      {/* Logout */}
      <Card className="border-red-100 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
          <LogOut className="h-5 w-5 text-red-400" /> Account
        </h2>
        <p className="mt-2 text-sm text-navy-500">
          Sign out of AcneLyze on this device. Your data stays safe and private.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setLogoutOpen(true)}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </Card>

      <Card className="flex items-start gap-3 bg-mist p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-navy-400" />
        <p className="text-sm leading-relaxed text-navy-500">
          AcneLyze provides skincare guidance only. It is not a medical device and does
          not diagnose or treat any condition.
        </p>
      </Card>

      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)} title="Log out?">
        <p className="text-sm leading-relaxed text-navy-500">
          You'll be signed out and returned to the home page.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setLogoutOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </Modal>
    </div>
  );
}
