import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Droplets,
  ShieldCheck,
  BedDouble,
  Sparkles,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/api';
import type { SkinProfile } from '@/types';

const tipSections = [
  {
    icon: Sparkles,
    title: 'Daily skincare tips',
    color: 'bg-powder-100 text-navy-600',
    tips: [
      'Cleanse twice a day — morning and night. Over-washing strips your skin barrier.',
      'Apply moisturizer to slightly damp skin to lock in hydration.',
      'Remove makeup fully before bed; sleeping in it clogs pores.',
      'Introduce only one new product at a time, waiting two weeks between launches.',
      'Clean your phone screen and change pillowcases regularly — both collect oil and bacteria.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Acne care tips',
    color: 'bg-lavender-100 text-lavender-500',
    tips: [
      'Do not pick or squeeze breakouts — it increases inflammation and scarring risk.',
      'Use non-comedogenic (will not clog pores) products across your whole routine.',
      'Ingredients like benzoyl peroxide and salicylic acid help mild acne; introduce them slowly.',
      'Wash gently after sweating — friction and trapped sweat aggravate breakouts.',
      'If acne is painful, widespread or affecting your confidence, see a dermatologist.',
    ],
  },
  {
    icon: Droplets,
    title: 'Hydration tips',
    color: 'bg-powder-100 text-navy-600',
    tips: [
      'Drink water steadily through the day rather than all at once.',
      'A humidifier helps in dry, air-conditioned or heated rooms.',
      'Dehydrated skin can still be oily — hydration is about water, not oil.',
      'Hyaluronic acid serums work best applied to damp skin, followed by moisturizer.',
      'Limit very dehydrating drinks like strong coffee and alcohol when you can.',
    ],
  },
  {
    icon: Sun,
    title: 'Sun protection',
    color: 'bg-peach-100 text-peach-400',
    tips: [
      'Wear SPF 30+ every morning — UV passes through clouds and windows.',
      'Reapply sunscreen every two hours outdoors, and after swimming or sweating.',
      'About a teaspoon of sunscreen covers the face and neck adequately.',
      'Hats and shade count as protection too — combine approaches.',
      'Sun damage is cumulative and largely invisible until years later. Consistency beats intensity.',
    ],
  },
  {
    icon: BedDouble,
    title: 'Healthy habits',
    color: 'bg-lavender-100 text-lavender-500',
    tips: [
      'Aim for 7-9 hours of sleep — skin repairs itself overnight.',
      'Manage stress; it raises cortisol, which can worsen breakouts and sensitivity.',
      'Regular exercise boosts circulation, but always cleanse your face afterwards.',
      'Avoid touching your face throughout the day.',
      'Be patient: skin cell turnover takes roughly 28 days, so give routines 6-8 weeks.',
    ],
  },
];

export default function TipsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user]);

  const personalized: string[] = [];
  if (profile?.skin_type === 'dry') {
    personalized.push(
      'Your profile says dry skin: keep baths and showers short and lukewarm, and layer a hydrating serum under a richer cream.',
    );
  }
  if (profile?.skin_type === 'oily') {
    personalized.push(
      'Your profile says oily skin: gel textures and a BHA exfoliant 2-3 times a week will help keep pores clear without over-drying.',
    );
  }
  if (profile?.skin_type === 'sensitive') {
    personalized.push(
      'Your profile says sensitive skin: stick to fragrance-free products and always patch-test for 48 hours on your inner forearm first.',
    );
  }
  if (profile?.skin_type === 'combination') {
    personalized.push(
      'Your profile says combination skin: treat zones differently — lighter textures on the T-zone, extra moisture on cheeks.',
    );
  }
  if (profile?.concerns?.includes('Acne & breakouts')) {
    personalized.push(
      'You flagged acne as a concern: change pillowcases twice weekly, keep hands off your face, and never skip sunscreen — some acne treatments make skin sun-sensitive.',
    );
  }
  if (profile?.concerns?.includes('Dark spots')) {
    personalized.push(
      'You flagged dark spots: daily sunscreen is the single most effective step — UV exposure makes pigmentation worse.',
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">AI Beauty Tips</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy-400">
          Practical, evidence-informed guidance for everyday skin health. General tips
          below become personal once your skin profile is set.
        </p>
      </div>

      {/* Personalized */}
      <Card className="border-peach-200 bg-peach-50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
          <Sparkles className="h-5 w-5 text-peach-400" />
          Suggestions for you
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-navy-400">Checking your skin profile…</p>
        ) : personalized.length > 0 ? (
          <ul className="mt-4 space-y-2.5">
            {personalized.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm leading-relaxed text-navy-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-peach-300" />
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
            <p className="text-sm text-navy-500">
              Set your skin type and concerns to unlock personalized tips.
            </p>
            <Link
              to="/dashboard/profile"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"
            >
              Set up profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </Card>

      {/* Tip sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {tipSections.map((s) => (
          <Card key={s.title} hover className="p-6">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-semibold text-navy-700">{s.title}</h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {s.tips.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm leading-relaxed text-navy-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-200" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        ))}

        {/* Disclaimer card fills the grid */}
        <Card className="flex flex-col justify-center bg-mist p-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-navy-400" />
            <div>
              <h2 className="text-lg font-semibold text-navy-700">A note on guidance</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">
                These tips reflect widely accepted general skincare practice. They are not
                personalized medical advice and do not replace a dermatologist. Skin that
                is painful, suddenly changing, or not improving deserves professional care.
              </p>
              <Link
                to="/dashboard/diet"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"
              >
                Support your skin from within — Diet Planner <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
