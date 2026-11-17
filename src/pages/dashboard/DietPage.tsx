import { useEffect, useState } from 'react';
import {
  Sunrise,
  Sun,
  Cookie,
  Moon,
  Droplets,
  Salad,
  Info,
  CalendarDays,
  Apple,
  Citrus,
  Carrot,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, upsertProfile } from '@/services/api';

type DietPreference = 'vegetarian' | 'non-vegetarian';

interface Meal {
  icon: typeof Sunrise;
  label: string;
  items: string[];
}

const meals: Record<DietPreference, Meal[]> = {
  vegetarian: [
    {
      icon: Sunrise,
      label: 'Breakfast',
      items: ['Overnight oats with berries and chia seeds', 'A handful of almonds or walnuts', 'Green tea or warm lemon water'],
    },
    {
      icon: Sun,
      label: 'Lunch',
      items: ['Chickpea or lentil bowl with brown rice', 'Mixed leafy salad with olive oil dressing', 'A cup of yogurt (optional) for probiotics'],
    },
    {
      icon: Cookie,
      label: 'Evening snacks',
      items: ['Carrot or cucumber sticks with hummus', 'A piece of seasonal fruit', 'Roasted makhana or unsalted nuts'],
    },
    {
      icon: Moon,
      label: 'Dinner',
      items: ['Vegetable stir-fry with tofu or paneer', 'Quinoa or whole-grain roti', 'Warm turmeric milk (low sugar)'],
    },
  ],
  'non-vegetarian': [
    {
      icon: Sunrise,
      label: 'Breakfast',
      items: ['Eggs any style with whole-grain toast', 'Avocado or fruit on the side', 'Green tea or black coffee'],
    },
    {
      icon: Sun,
      label: 'Lunch',
      items: ['Grilled chicken or fish with lemon', 'Brown rice or sweet potato', 'Steamed greens or salad with olive oil'],
    },
    {
      icon: Cookie,
      label: 'Evening snacks',
      items: ['Greek yogurt with berries', 'A boiled egg or roasted chana', 'Carrot sticks with hummus'],
    },
    {
      icon: Moon,
      label: 'Dinner',
      items: ['Baked salmon or grilled fish (omega-3 rich)', 'Sautéed vegetables', 'Light soup or salad'],
    },
  ],
};

const fruitsVeggies = [
  { icon: Citrus, name: 'Citrus fruits', benefit: 'Vitamin C — supports collagen production' },
  { icon: Carrot, name: 'Carrots & pumpkin', benefit: 'Beta-carotene — supports skin cell renewal' },
  { icon: Apple, name: 'Berries', benefit: 'Antioxidants — help protect against oxidative stress' },
  { icon: Salad, name: 'Leafy greens', benefit: 'Vitamins A, C, K — support overall skin health' },
];

const nutritionRows = [
  { name: 'Omega-3 fatty acids', role: 'Help maintain the skin barrier and calm inflammation', sources: 'Fatty fish, flaxseed, walnuts' },
  { name: 'Vitamin C', role: 'Needed for collagen synthesis and antioxidant defence', sources: 'Citrus, bell peppers, strawberries' },
  { name: 'Vitamin E', role: 'Antioxidant that protects skin cell membranes', sources: 'Almonds, sunflower seeds, avocado' },
  { name: 'Zinc', role: 'Supports skin healing and immune function', sources: 'Pumpkin seeds, lentils, chickpeas' },
  { name: 'Water', role: 'Keeps skin cells hydrated; supports elasticity', sources: 'Water, herbal teas, water-rich fruit' },
];

const weekPlan: Record<DietPreference, { day: string; focus: string }[]> = {
  vegetarian: [
    { day: 'Mon', focus: 'Legume bowl day — lentils or chickpeas at lunch' },
    { day: 'Tue', focus: 'Colorful salad day — five vegetables on your plate' },
    { day: 'Wed', focus: 'Whole-grain day — swap refined grains for whole' },
    { day: 'Thu', focus: 'Omega-3 day — add flaxseed or chia to breakfast' },
    { day: 'Fri', focus: 'Probiotic day — yogurt or fermented foods' },
    { day: 'Sat', focus: 'Nut & seed day — a small mixed handful daily' },
    { day: 'Sun', focus: 'Cook-at-home day — simple, low-sugar meals' },
  ],
  'non-vegetarian': [
    { day: 'Mon', focus: 'Fish day — grilled fish at lunch or dinner' },
    { day: 'Tue', focus: 'Egg-protein day — eggs with veg at breakfast' },
    { day: 'Wed', focus: 'Whole-grain day — swap refined grains for whole' },
    { day: 'Thu', focus: 'Lean poultry day — grilled, not fried' },
    { day: 'Fri', focus: 'Probiotic day — yogurt or fermented foods' },
    { day: 'Sat', focus: 'Colorful veg day — five vegetables on your plate' },
    { day: 'Sun', focus: 'Cook-at-home day — simple, low-sugar meals' },
  ],
};

const hydrationGoals = [
  { time: 'On waking', amount: '1 glass' },
  { time: 'Mid-morning', amount: '1 glass' },
  { time: 'With lunch', amount: '1 glass' },
  { time: 'Afternoon', amount: '1 glass' },
  { time: 'Evening', amount: '1 glass' },
  { time: 'Before bed (small)', amount: '½ glass' },
];

export default function DietPage() {
  const { user } = useAuth();
  const [preference, setPreference] = useState<DietPreference>('vegetarian');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then((p) => {
        const prefs = p?.preferences ?? [];
        if (prefs.includes('non-vegetarian')) setPreference('non-vegetarian');
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [user]);

  const savePreference = async (pref: DietPreference) => {
    setPreference(pref);
    if (!user) return;
    setSaving(true);
    try {
      const existing = (await getProfile(user.id))?.preferences ?? [];
      await upsertProfile({
        id: user.id,
        preferences: [...existing.filter((p) => p !== 'vegetarian' && p !== 'non-vegetarian'), pref],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">AI Diet Planner</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy-400">
          Balanced, skin-supportive nutrition guidance. Food supports healthy skin — it is
          not a cure for any condition and never replaces professional nutritional advice.
        </p>
      </div>

      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm leading-relaxed text-amber-800">
          This planner offers general nutrition ideas for skin wellbeing. It does not
          claim that any food cures acne or replaces advice from a doctor or registered
          dietitian.
        </p>
      </Card>

      {/* Preference */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-navy-700">Dietary preference</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {(['vegetarian', 'non-vegetarian'] as const).map((p) => (
            <button
              key={p}
              onClick={() => savePreference(p)}
              disabled={saving}
              className={`rounded-full border px-5 py-2 text-sm font-semibold capitalize transition-colors ${
                preference === p
                  ? 'border-navy-700 bg-navy-700 text-white'
                  : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300'
              }`}
            >
              {p}
            </button>
          ))}
          {saved && <span className="text-sm font-medium text-emerald-600">Preference saved</span>}
        </div>
      </Card>

      {/* Daily meals */}
      <section>
        <h2 className="text-xl font-semibold text-navy-700">Daily meal suggestions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {meals[preference].map((m) => (
            <Card key={m.label} hover className="p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-powder-100 text-navy-600">
                  <m.icon className="h-4.5 w-4.5" />
                </span>
                <h3 className="font-semibold text-navy-700">{m.label}</h3>
              </div>
              <ul className="space-y-2">
                {m.items.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-peach-300" />
                    {i}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fruits & vegetables */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy-700">Skin-friendly fruits & vegetables</h2>
          <ul className="mt-4 space-y-3">
            {fruitsVeggies.map((f) => (
              <li key={f.name} className="flex items-start gap-3 rounded-xl bg-mist p-3.5">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-700">{f.name}</p>
                  <p className="text-xs leading-relaxed text-navy-500">{f.benefit}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Hydration */}
        <Card className="bg-powder-100 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
            <Droplets className="h-5 w-5 text-navy-500" /> Daily hydration reminders
          </h2>
          <p className="mt-1.5 text-sm text-navy-500">
            A steady schedule of about 6-8 glasses (roughly 1.5-2 litres) works for most
            adults. Needs vary with activity and climate.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {hydrationGoals.map((h) => (
              <div key={h.time} className="rounded-xl bg-white/80 px-3.5 py-3">
                <p className="text-xs font-medium text-navy-400">{h.time}</p>
                <p className="mt-0.5 text-sm font-bold text-navy-700">{h.amount}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Nutrition info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-navy-700">Key nutrients for skin</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs font-bold uppercase tracking-wide text-navy-400">
                <th className="pb-3 pr-4">Nutrient</th>
                <th className="pb-3 pr-4">Why it matters</th>
                <th className="pb-3">Food sources</th>
              </tr>
            </thead>
            <tbody>
              {nutritionRows.map((r) => (
                <tr key={r.name} className="border-b border-navy-50 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-navy-700">{r.name}</td>
                  <td className="py-3 pr-4 text-navy-500">{r.role}</td>
                  <td className="py-3 text-navy-600">{r.sources}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Weekly plan */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
          <CalendarDays className="h-5 w-5 text-navy-500" /> Weekly meal plan
        </h2>
        <p className="mt-1 text-sm text-navy-400">A simple daily focus to build variety — repeat or adapt freely.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {weekPlan[preference].map((d) => (
            <div key={d.day} className="rounded-xl border border-navy-100 p-4 transition-colors hover:border-navy-200">
              <p className="text-xs font-bold uppercase tracking-wide text-peach-400">{d.day}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{d.focus}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
