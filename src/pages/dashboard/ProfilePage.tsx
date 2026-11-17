import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, ScanFace, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, upsertProfile, listAnalyses } from '@/services/api';
import type { SkinType, Sensitivity } from '@/types';

const CONCERNS = ['Acne & breakouts', 'Dark spots', 'Dryness', 'Redness', 'Fine lines', 'Uneven texture', 'Enlarged pores', 'Dullness'];
const PREFERENCES = ['Fragrance-free', 'Cruelty-free', 'Minimal routine', 'Clean beauty', 'Vegetarian', 'Non-vegetarian'];

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [skinType, setSkinType] = useState<SkinType | ''>('');
  const [sensitivity, setSensitivity] = useState<Sensitivity | ''>('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? '');
    const load = async () => {
      setLoading(true);
      try {
        const [p, count] = await Promise.all([
          getProfile(user.id),
          listAnalyses().then((rows) => rows.length),
        ]);
        if (p) {
          setFullName(p.full_name ?? '');
          setSkinType(p.skin_type ?? '');
          setSensitivity(p.sensitivity ?? '');
          setConcerns(p.concerns ?? []);
          setPreferences(p.preferences ?? []);
        }
        setAnalyses(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (fullName.trim().length < 2) {
      setNameError('Please enter your name.');
      return;
    }
    setNameError('');
    setSaving(true);
    setError('');
    try {
      await upsertProfile({
        id: user.id,
        full_name: fullName.trim(),
        skin_type: skinType || undefined,
        sensitivity: sensitivity || undefined,
        concerns,
        preferences,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }

  const initials = (fullName || email)[0]?.toUpperCase() ?? 'U';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-navy-400">Your personal and skin information.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Summary card */}
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-powder-100 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-600 to-navy-700 text-xl font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-navy-700">{fullName || 'Your profile'}</h2>
            <p className="truncate text-sm text-navy-400">{email}</p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="rounded-xl bg-mist px-4 py-2">
              <p className="text-lg font-bold text-navy-700">{analyses}</p>
              <p className="text-[11px] font-medium text-navy-400">Analyses</p>
            </div>
            <div className="rounded-xl bg-mist px-4 py-2">
              <p className="text-lg font-bold text-navy-700">{concerns.length}</p>
              <p className="text-[11px] font-medium text-navy-400">Concerns</p>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        {/* Personal information */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
            <UserRound className="h-5 w-5 text-navy-500" /> Personal information
          </h2>
          <div className="mt-5 space-y-4">
            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={nameError}
              placeholder="Your name"
            />
            <Input label="Email" value={email} disabled className="bg-mist text-navy-400" />
            <p className="text-xs leading-relaxed text-navy-400">
              Your email is your sign-in identity and cannot be changed here.
            </p>
          </div>
        </Card>

        {/* Skin profile */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
            <ScanFace className="h-5 w-5 text-navy-500" /> Skin profile
          </h2>
          <div className="mt-5 space-y-4">
            <Select
              label="Skin type"
              value={skinType}
              onChange={(e) => setSkinType(e.target.value as SkinType)}
              options={[
                { value: '', label: 'Not set' },
                { value: 'normal', label: 'Normal' },
                { value: 'dry', label: 'Dry' },
                { value: 'oily', label: 'Oily' },
                { value: 'combination', label: 'Combination' },
                { value: 'sensitive', label: 'Sensitive' },
              ]}
            />
            <Select
              label="Sensitivity"
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value as Sensitivity)}
              options={[
                { value: '', label: 'Not set' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
            <div>
              <Label>Skin concerns</Label>
              <div className="flex flex-wrap gap-2">
                {CONCERNS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(concerns, setConcerns, c)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      concerns.includes(c)
                        ? 'border-navy-700 bg-navy-700 text-white'
                        : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(preferences, setPreferences, p)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      preferences.includes(p)
                        ? 'border-peach-300 bg-peach-100 text-navy-700'
                        : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-3 lg:col-span-2">
          <Button type="submit" loading={saving}>Save changes</Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Profile saved
            </span>
          )}
        </div>
      </form>

      {/* Recent analyses shortcut */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-700">Analysis history</h2>
          <Link to="/dashboard/history" className="flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-700 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-2 text-sm text-navy-400">
          {analyses > 0
            ? `Your most recent analysis is listed with its date in history. ${analyses} total.`
            : 'You have not run any analyses yet.'}
        </p>
        {analyses > 0 && (
          <Link to="/dashboard/history" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-navy-700 hover:underline">
            <Loader2 className="hidden" /> Open analysis history
          </Link>
        )}
      </Card>
    </div>
  );
}
