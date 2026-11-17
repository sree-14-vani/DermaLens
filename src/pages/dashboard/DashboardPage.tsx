import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanFace,
  Wand2,
  ListChecks,
  MessageCircle,
  Salad,
  Sparkles,
  ArrowRight,
  Clock3,
  CircleCheck,
  Circle,
  Info,
  Lightbulb,
} from 'lucide-react';
import { Card, StatCard, EmptyState } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, listAnalyses, listChecklist, toggleChecklistItem, getSignedImageUrl } from '@/services/api';
import type { SkinProfile, SkinAnalysis, ChecklistItem } from '@/types';
import { todayISO, formatDate, severityLabels } from '@/lib/utils';

const quickAccess = [
  { to: '/dashboard/analysis', label: 'Skin Analysis', icon: ScanFace, accent: 'bg-powder-100 text-navy-600' },
  { to: '/dashboard/enhance', label: 'Enhance Image', icon: Wand2, accent: 'bg-lavender-100 text-lavender-500' },
  { to: '/dashboard/routine', label: 'Routine', icon: ListChecks, accent: 'bg-peach-100 text-peach-400' },
  { to: '/dashboard/tips', label: 'Beauty Tips', icon: Sparkles, accent: 'bg-powder-100 text-navy-600' },
  { to: '/dashboard/diet', label: 'Diet Planner', icon: Salad, accent: 'bg-lavender-100 text-lavender-500' },
  { to: '/dashboard/chatbot', label: 'AI Chatbot', icon: MessageCircle, accent: 'bg-peach-100 text-peach-400' },
];

const beautyTips = [
  'Apply sunscreen every morning, even on cloudy days — UV exposure is the leading cause of premature skin ageing.',
  'Keep showers lukewarm, not hot. Hot water strips your skin of its natural oils.',
  'Patch-test new products on your inner forearm for 48 hours before applying them to your face.',
  'Change your pillowcase twice a week to reduce oil and bacteria buildup.',
  'Moisturize while your skin is still slightly damp to lock in hydration.',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [p, a, c] = await Promise.all([
          getProfile(user.id),
          listAnalyses(),
          listChecklist(todayISO()),
        ]);
        setProfile(p);
        setAnalyses(a);
        setChecklist(c);
        const urls: Record<string, string> = {};
        await Promise.all(
          a.slice(0, 4).map(async (an) => {
            try {
              urls[an.id] = await getSignedImageUrl(an.image_path);
            } catch {
              /* thumbnail unavailable */
            }
          }),
        );
        setThumbs(urls);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there';
  const doneCount = checklist.filter((c) => c.done).length;
  const tipIndex = new Date().getDate() % beautyTips.length;

  const toggle = async (item: ChecklistItem) => {
    setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)));
    try {
      await toggleChecklistItem(item.id, !item.done);
    } catch {
      setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, done: item.done } : c)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-navy-700 px-6 py-10 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lavender-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-peach-400/20 blur-3xl" />
        <p className="relative text-sm text-navy-200">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="relative mt-1 text-3xl tracking-tight sm:text-4xl">
          Welcome back, {displayName}
        </h1>
        <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-navy-100">
          {profile?.skin_type
            ? `Your profile is set to ${profile.skin_type} skin. Pick up where you left off below.`
            : 'Complete your skin profile to unlock fully personalized routines and tips.'}
        </p>
        {!profile?.skin_type && (
          <Link
            to="/dashboard/profile"
            className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-peach-100 px-5 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-peach-200"
          >
            Set up your skin profile <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<ScanFace className="h-5 w-5" />} label="Total analyses" value={String(analyses.length)} accent="powder" />
        <StatCard icon={<Clock3 className="h-5 w-5" />} label="Last analysis" value={analyses[0] ? formatDate(analyses[0].created_at) : 'None yet'} accent="lavender" />
        <StatCard icon={<CircleCheck className="h-5 w-5" />} label="Today's checklist" value={`${doneCount} of ${checklist.length || 0} done`} accent="peach" />
      </div>

      {/* Quick access */}
      <section>
        <h2 className="text-xl font-semibold text-navy-700">Quick access</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {quickAccess.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group rounded-2xl border border-navy-100 bg-white p-4 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${q.accent}`}>
                <q.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-navy-600 group-hover:text-navy-700">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent analyses */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-700">Recent analyses</h2>
            <Link to="/dashboard/history" className="text-sm font-medium text-navy-500 hover:text-navy-700 hover:underline">
              View all
            </Link>
          </div>
          {analyses.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={<ScanFace className="h-7 w-7" />}
                title="No analyses yet"
                description="Run your first AI skin analysis to see results here."
                action={
                  <Link
                    to="/dashboard/analysis"
                    className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-600"
                  >
                    Start analysis <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {analyses.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/dashboard/analysis?review=${a.id}`}
                    className="flex items-center gap-4 rounded-xl border border-navy-100 p-3 transition-colors hover:bg-mist"
                  >
                    {thumbs[a.id] ? (
                      <img src={thumbs[a.id]} alt="Analysis thumbnail" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-mist">
                        <ScanFace className="h-5 w-5 text-navy-300" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy-700">{formatDate(a.created_at)}</p>
                      <p className="text-xs text-navy-400">
                        {a.status === 'complete' && a.acne_severity
                          ? severityLabels[a.acne_severity]
                          : 'Awaiting AI model connection'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-navy-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Daily checklist */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-700">Today's checklist</h2>
            <Link to="/dashboard/routine" className="text-sm font-medium text-navy-500 hover:text-navy-700 hover:underline">
              Manage
            </Link>
          </div>
          {checklist.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={<ListChecks className="h-7 w-7" />}
                title="No checklist items"
                description="Add steps in your skincare routine and they'll appear here each day."
              />
            </div>
          ) : (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-powder-300 to-lavender-300 transition-all duration-300"
                  style={{ width: checklist.length ? `${(doneCount / checklist.length) * 100}%` : '0%' }}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {checklist.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => toggle(c)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-mist"
                    >
                      {c.done ? (
                        <CircleCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-navy-300" />
                      )}
                      <span className={`text-sm ${c.done ? 'text-navy-300 line-through' : 'text-navy-600'}`}>
                        <span className="mr-2 rounded-md bg-mist px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-400">
                          {c.period}
                        </span>
                        {c.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* Routine overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-700">Routine overview</h2>
            <Link to="/dashboard/routine" className="text-sm font-medium text-navy-500 hover:text-navy-700 hover:underline">
              Open builder
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(['morning', 'night'] as const).map((period) => {
              const items = checklist.filter((c) => c.period === period);
              return (
                <div key={period} className="rounded-xl bg-mist p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-navy-400">{period} routine</p>
                  {items.length === 0 ? (
                    <p className="mt-2 text-sm text-navy-400">Nothing planned yet.</p>
                  ) : (
                    <p className="mt-2 text-sm text-navy-600">
                      {items.length} step{items.length > 1 ? 's' : ''} · {items.filter((i) => i.done).length} completed
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Diet summary + tip */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-700">Diet planner summary</h2>
              <Link to="/dashboard/diet" className="text-sm font-medium text-navy-500 hover:text-navy-700 hover:underline">
                Open planner
              </Link>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-lavender-100/60 p-4">
              <Salad className="mt-0.5 h-5 w-5 shrink-0 text-lavender-500" />
              <p className="text-sm leading-relaxed text-navy-600">
                Support your skin from the inside: aim for colorful fruits and vegetables,
                omega-3 rich foods and steady hydration throughout the day. Your diet
                planner has balanced meal ideas for every preference.
              </p>
            </div>
          </Card>

          <Card className="bg-peach-50 p-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-peach-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-peach-400">Beauty tip of the day</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">{beautyTips[tipIndex]}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Demo notice */}
      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm leading-relaxed text-amber-800">
          <span className="font-semibold">Demo mode:</span> the AI analysis model is not
          connected yet. Uploads are saved securely and results will appear here once the
          model goes live — DermaLens never shows fabricated predictions.
        </p>
      </Card>
    </div>
  );
}
