import { useEffect, useMemo, useState } from 'react';
import {
  Sun,
  Moon,
  Plus,
  Trash2,
  CircleCheck,
  Circle,
  Info,
  ListChecks,
  AlertTriangle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, upsertProfile, listChecklist, addChecklistItem, toggleChecklistItem, removeChecklistItem } from '@/services/api';
import type { SkinType, Sensitivity, ChecklistItem } from '@/types';
import { todayISO } from '@/lib/utils';

const SKIN_TYPE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'dry', label: 'Dry' },
  { value: 'oily', label: 'Oily' },
  { value: 'combination', label: 'Combination' },
  { value: 'sensitive', label: 'Sensitive' },
];

const CONCERN_OPTIONS = ['Acne & breakouts', 'Dark spots', 'Dryness', 'Redness', 'Fine lines', 'Uneven texture', 'Enlarged pores', 'Dullness'];

interface RoutineStep {
  step: string;
  detail: string;
}

const routines: Record<SkinType, { morning: RoutineStep[]; night: RoutineStep[] }> = {
  normal: {
    morning: [
      { step: 'Gentle cleanser', detail: 'A mild, pH-balanced face wash to start the day fresh.' },
      { step: 'Moisturizer', detail: 'A lightweight lotion to keep skin balanced.' },
      { step: 'Sunscreen SPF 30+', detail: 'The single most important anti-ageing step. Reapply at midday.' },
    ],
    night: [
      { step: 'Cleanser', detail: 'Remove sunscreen, oil and grime from the day.' },
      { step: 'Antioxidant serum (optional)', detail: 'A vitamin C or niacinamide serum supports skin tone.' },
      { step: 'Moisturizer', detail: 'Slightly richer than your daytime one is fine at night.' },
    ],
  },
  dry: {
    morning: [
      { step: 'Cream cleanser', detail: 'A non-foaming, hydrating cleanser that will not strip oils.' },
      { step: 'Hydrating serum', detail: 'Hyaluronic acid on damp skin pulls in moisture.' },
      { step: 'Rich moisturizer', detail: 'Look for ceramides and fatty acids to repair the barrier.' },
      { step: 'Sunscreen SPF 30+', detail: 'Choose a moisturizing, creamy SPF formula.' },
    ],
    night: [
      { step: 'Cream cleanser', detail: 'Gentle removal without tightness.' },
      { step: 'Hydrating serum', detail: 'Layer hydration while skin is still damp.' },
      { step: 'Occlusive night cream', detail: 'Seal everything in; a balm texture works well in winter.' },
    ],
  },
  oily: {
    morning: [
      { step: 'Foaming gel cleanser', detail: 'Removes overnight oil without over-scrubbing.' },
      { step: 'Lightweight moisturizer', detail: 'Oil-free gel texture — yes, oily skin still needs moisture.' },
      { step: 'Sunscreen SPF 30+', detail: 'Pick a matte-finish, non-comedogenic formula.' },
    ],
    night: [
      { step: 'Gel cleanser', detail: 'Double-cleanse on makeup or SPF days.' },
      { step: 'BHA exfoliant (2-3x per week)', detail: 'Salicylic acid keeps pores clear. Do not use daily at first.' },
      { step: 'Oil-free moisturizer', detail: 'Light gel-cream to rebalance overnight.' },
    ],
  },
  combination: {
    morning: [
      { step: 'Balancing cleanser', detail: 'Something gentle that respects both dry and oily zones.' },
      { step: 'Lightweight moisturizer', detail: 'Apply more on cheeks, less on the T-zone.' },
      { step: 'Sunscreen SPF 30+', detail: 'A fluid, non-greasy SPF works for most combination skin.' },
    ],
    night: [
      { step: 'Gentle cleanser', detail: 'Clean Slate for the night routine.' },
      { step: 'Niacinamide serum', detail: 'Helps even out oil production across zones.' },
      { step: 'Moisturizer', detail: 'Medium weight; add extra on dry areas.' },
    ],
  },
  sensitive: {
    morning: [
      { step: 'Micro-foam or milk cleanser', detail: 'Fragrance-free and sulfate-free only.' },
      { step: 'Barrier moisturizer', detail: 'Ceramides and panthenol calm and protect.' },
      { step: 'Mineral sunscreen SPF 30+', detail: 'Zinc oxide formulas are usually kindest to reactive skin.' },
    ],
    night: [
      { step: 'Gentle cleanser', detail: 'Lukewarm water only — hot water triggers flushing.' },
      { step: 'Soothing serum (optional)', detail: 'Centella or oat extract can reduce reactivity.' },
      { step: 'Barrier moisturizer', detail: 'Keep the routine minimal; less is more for sensitive skin.' },
    ],
  },
};

const productCategories: Record<SkinType, string[]> = {
  normal: ['Gentle cleanser', 'Balancing toner', 'Lightweight moisturizer', 'Fluid sunscreen'],
  dry: ['Cream cleanser', 'Hydrating serum', 'Ceramide moisturizer', 'Creamy sunscreen'],
  oily: ['Gel cleanser', 'BHA exfoliant', 'Oil-free gel moisturizer', 'Matte sunscreen'],
  combination: ['Balancing cleanser', 'Niacinamide serum', 'Medium-weight moisturizer', 'Fluid sunscreen'],
  sensitive: ['Fragrance-free cleanser', 'Barrier repair serum', 'Ceramide moisturizer', 'Mineral sunscreen'],
};

const precautionsByType: Record<SkinType, string[]> = {
  normal: ['Do not over-exfoliate — twice a week is plenty.', 'Introduce one new product at a time.'],
  dry: ['Avoid foaming sulfate cleansers and alcohol-heavy toners.', 'Exfoliate no more than once a week.'],
  oily: ['Never skip moisturizer — dehydrated skin produces more oil.', 'Do not over-wash; twice daily is enough.'],
  combination: ['Use zone-specific amounts rather than one uniform layer.', 'Spot-treat the T-zone instead of treating the whole face.'],
  sensitive: ['Patch-test everything for 48 hours before facial use.', 'Avoid fragrance, essential oils and physical scrubs.'],
};

const sensitivityNotes: Record<Sensitivity, string> = {
  low: 'Your low sensitivity profile tolerates most active ingredients well. Still introduce them gradually.',
  medium: 'With medium sensitivity, space out actives (exfoliants, retinoids) to 2-3 times per week.',
  high: 'With high sensitivity, keep the routine minimal and fragrance-free, and prefer mineral sunscreens.',
};

export default function RoutinePage() {
  const { user } = useAuth();
  const [skinType, setSkinType] = useState<SkinType>('normal');
  const [sensitivity, setSensitivity] = useState<Sensitivity>('low');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newPeriod, setNewPeriod] = useState<'morning' | 'night'>('morning');
  const [itemError, setItemError] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [p, c] = await Promise.all([getProfile(user.id), listChecklist(todayISO())]);
        if (p) {
          if (p.skin_type) setSkinType(p.skin_type);
          if (p.sensitivity) setSensitivity(p.sensitivity);
          setConcerns(p.concerns ?? []);
        }
        setItems(c);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertProfile({ id: user.id, skin_type: skinType, sensitivity, concerns });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const toggleConcern = (c: string) => {
    setConcerns((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const addFromRoutine = async (step: RoutineStep, period: 'morning' | 'night') => {
    const item = await addChecklistItem(period, step.step);
    setItems((prev) => [...prev, item]);
  };

  const addCustom = async () => {
    if (newLabel.trim().length < 2) {
      setItemError('Give the step a short name (at least 2 characters).');
      return;
    }
    try {
      const item = await addChecklistItem(newPeriod, newLabel.trim());
      setItems((prev) => [...prev, item]);
      setNewLabel('');
      setItemError('');
      setModalOpen(false);
    } catch {
      setItemError('Could not add the step. Please try again.');
    }
  };

  const toggle = async (item: ChecklistItem) => {
    setItems((prev) => prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)));
    try {
      await toggleChecklistItem(item.id, !item.done);
    } catch {
      setItems((prev) => prev.map((c) => (c.id === item.id ? { ...c, done: item.done } : c)));
    }
  };

  const remove = async (item: ChecklistItem) => {
    setItems((prev) => prev.filter((c) => c.id !== item.id));
    try {
      await removeChecklistItem(item.id);
    } catch {
      setItems((prev) => [...prev, item]);
    }
  };

  const routine = useMemo(() => routines[skinType], [skinType]);
  const doneCount = items.filter((i) => i.done).length;

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
        <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">Personalized Skincare Routine</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy-400">
          Tell us about your skin and get a morning and night routine with product
          categories and precautions matched to it.
        </p>
      </div>

      {/* Profile form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-navy-700">Your skin profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="Skin type"
            value={skinType}
            options={SKIN_TYPE_OPTIONS}
            onChange={(e) => setSkinType(e.target.value as SkinType)}
          />
          <Select
            label="Sensitivity"
            value={sensitivity}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            onChange={(e) => setSensitivity(e.target.value as Sensitivity)}
          />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-navy-700">Main concerns</p>
          <div className="flex flex-wrap gap-2">
            {CONCERN_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
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
        <div className="mt-5 flex items-center gap-3">
          <Button loading={saving} onClick={saveProfile}>Save profile & update routine</Button>
          {saved && <span className="text-sm font-medium text-emerald-600">Profile saved</span>}
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-powder-200 bg-powder-50 px-4 py-3 text-sm text-navy-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        {sensitivityNotes[sensitivity]}
      </div>

      {/* Routines */}
      <div className="grid gap-6 lg:grid-cols-2">
        {(['morning', 'night'] as const).map((period) => (
          <Card key={period} className="p-6">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${period === 'morning' ? 'bg-peach-100 text-peach-400' : 'bg-navy-100 text-navy-600'}`}>
                {period === 'morning' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </span>
              <h2 className="text-lg font-semibold text-navy-700">
                {period === 'morning' ? 'Morning routine' : 'Night routine'}
              </h2>
            </div>
            <ol className="mt-5 space-y-4">
              {routine[period].map((s, i) => (
                <li key={s.step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-bold text-navy-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-700">{s.step}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-navy-500">{s.detail}</p>
                  </div>
                  <button
                    onClick={() => addFromRoutine(s, period)}
                    title="Add to today's checklist"
                    className="self-start rounded-lg p-1.5 text-navy-300 transition-colors hover:bg-mist hover:text-navy-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product categories */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy-700">Product categories to look for</h2>
          <p className="mt-1 text-sm text-navy-400">
            General category guidance — not brand or medical recommendations.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {productCategories[skinType].map((p) => (
              <li key={p} className="rounded-xl bg-mist px-4 py-3 text-sm font-medium text-navy-600">
                {p}
              </li>
            ))}
          </ul>
        </Card>

        {/* Precautions */}
        <Card className="border-amber-200 bg-amber-50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-700">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Precautions for {skinType} skin
          </h2>
          <ul className="mt-4 space-y-2.5">
            {precautionsByType[skinType].map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-amber-800">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" /> {p}
              </li>
            ))}
            <li className="flex items-start gap-2 text-sm leading-relaxed text-amber-800">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              For persistent or painful skin concerns, consult a dermatologist — routines
              here are general guidance, not medical advice.
            </li>
          </ul>
        </Card>
      </div>

      {/* Daily checklist */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy-700">Daily checklist</h2>
            <p className="text-sm text-navy-400">
              {items.length ? `${doneCount} of ${items.length} done today` : 'Add steps to start tracking'}
            </p>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add step
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-navy-200 bg-mist px-6 py-10 text-center">
            <ListChecks className="mx-auto h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm text-navy-400">
              Your checklist is empty. Tap the plus next to any routine step above, or add a custom step.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {items.map((c) => (
              <div key={c.id} className="group flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-mist">
                <button onClick={() => toggle(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  {c.done ? (
                    <CircleCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-navy-300" />
                  )}
                  <span className={`truncate text-sm ${c.done ? 'text-navy-300 line-through' : 'text-navy-600'}`}>
                    <span className="mr-2 rounded-md bg-mist px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-400">
                      {c.period}
                    </span>
                    {c.label}
                  </span>
                </button>
                <button
                  onClick={() => remove(c)}
                  className="rounded-lg p-1.5 text-navy-200 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  aria-label={`Remove ${c.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add a checklist step">
        <div className="space-y-4">
          <Input
            label="Step name"
            placeholder="e.g. Apply lip balm"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            error={itemError}
          />
          <Select
            label="Time of day"
            value={newPeriod}
            options={[
              { value: 'morning', label: 'Morning' },
              { value: 'night', label: 'Night' },
            ]}
            onChange={(e) => setNewPeriod(e.target.value as 'morning' | 'night')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={addCustom}>Add step</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
