import { useNavigate } from 'react-router-dom';
import {
  ScanFace,
  Wand2,
  ListChecks,
  MessageCircleHeart,
  Salad,
  Sun,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Camera,
  BrainCircuit,
  ClipboardList,
  Star,
  HeartHandshake,
  Leaf,
  Lock,
} from 'lucide-react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { useAuth } from '@/hooks/useAuth';

const HERO_IMG =
  'https://images.pexels.com/photos/15988655/pexels-photo-15988655.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const INTRO_IMG =
  'https://images.pexels.com/photos/7011191/pexels-photo-7011191.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const features = [
  {
    icon: ScanFace,
    title: 'AI Skin Analysis',
    description:
      'Upload a facial photo and let our AI model examine it for common skin concerns such as acne, with clearly graded severity levels.',
    accent: 'bg-powder-100 text-navy-600',
  },
  {
    icon: Wand2,
    title: 'Image Enhancement',
    description:
      'Refine lighting and clarity of your photos while preserving identity, facial structure and natural skin texture — never artificial filters.',
    accent: 'bg-lavender-100 text-lavender-500',
  },
  {
    icon: ListChecks,
    title: 'Personalized Routines',
    description:
      'Morning and night routines built around your skin type, concerns and sensitivity — with a daily checklist to keep you consistent.',
    accent: 'bg-peach-100 text-peach-400',
  },
  {
    icon: MessageCircleHeart,
    title: 'AI Beauty Assistant',
    description:
      'A friendly chatbot that answers your skincare questions, from routine order to hydration habits, anytime you need it.',
    accent: 'bg-powder-100 text-navy-600',
  },
  {
    icon: Salad,
    title: 'Skin-Supportive Diet Planner',
    description:
      'Balanced meal ideas, hydration reminders and weekly plans that support healthy skin from the inside.',
    accent: 'bg-lavender-100 text-lavender-500',
  },
  {
    icon: Sun,
    title: 'Beauty Tips Library',
    description:
      'Curated guidance on sun protection, acne care and daily habits, personalized to your skin profile.',
    accent: 'bg-peach-100 text-peach-400',
  },
];

const steps = [
  {
    icon: Camera,
    step: '01',
    title: 'Capture or upload',
    description:
      'Take a selfie with your camera or upload a clear facial photo in natural light.',
  },
  {
    icon: BrainCircuit,
    step: '02',
    title: 'AI analyzes your skin',
    description:
      'Our AI model examines your photo for visible concerns and grades acne severity when detected.',
  },
  {
    icon: ClipboardList,
    step: '03',
    title: 'Get your routine',
    description:
      'Receive a personalized routine, product categories and daily care guidance built for your skin.',
  },
];

const whyUs = [
  {
    icon: ShieldCheck,
    title: 'Honest, not fake',
    description:
      'Results come from a real AI model. When the model is not connected, we clearly show a demo state — we never invent predictions.',
  },
  {
    icon: Lock,
    title: 'Private by design',
    description:
      'Your photos are stored in a private, access-controlled space. Only you can ever see your analyses.',
  },
  {
    icon: HeartHandshake,
    title: 'Guidance, not diagnosis',
    description:
      'We help you understand and care for your skin. For medical concerns we always point you to a dermatologist.',
  },
  {
    icon: Leaf,
    title: 'Whole-picture care',
    description:
      'Skin health is more than creams — routines, nutrition, hydration and habits, all in one place.',
  },
];

const testimonials = [
  {
    name: 'Sample User — Ananya',
    role: 'Combined skin, 24',
    quote:
      'The routine builder finally made the order of products make sense. The morning and night checklists keep me consistent.',
  },
  {
    name: 'Sample User — Rohan',
    role: 'Oily skin, 27',
    quote:
      'The analysis interface is clean and honest about what the AI can and cannot tell you. That transparency won me over.',
  },
  {
    name: 'Sample User — Meera',
    role: 'Sensitive skin, 31',
    quote:
      'I love the diet planner reminders. Drinking water and eating better actually showed on my skin within weeks.',
  },
  {
    name: 'Sample User — Sara',
    role: 'Dry skin, 22',
    quote:
      'The chatbot answered my questions about layering products late at night. It feels like a knowledgeable friend.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-[480px] w-[480px] rounded-full bg-powder-100 blur-3xl" />
        <div className="pointer-events-none absolute top-64 -left-24 h-72 w-72 rounded-full bg-lavender-100 blur-3xl" />
        <div className="container-app relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-navy-100 bg-white px-4 py-1.5 text-xs font-semibold text-navy-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-peach-300" />
              AI-powered skincare guidance
            </span>
            <h1 className="mt-6 text-4xl leading-tight tracking-tight text-navy-700 sm:text-5xl lg:text-6xl">
              Your Skin, Your Science,{' '}
              <span className="bg-gradient-to-r from-peach-300 via-peach-400 to-lavender-400 bg-clip-text text-transparent">
                Your Confidence.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-navy-500">
              Discover your skin, understand your concerns, and build a skincare routine
              powered by AI.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Features
              </Button>
            </div>
            <p className="mt-6 text-xs text-navy-400">
              No credit card needed · Private photo storage · Guidance, not diagnosis
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-powder-100 via-lavender-100 to-peach-50" />
            <img
              src={HERO_IMG}
              alt="Close-up portrait showcasing clear, healthy skin"
              className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-card-hover"
              loading="eager"
            />
            <div className="absolute -bottom-6 -left-4 rounded-2xl bg-white/95 px-5 py-4 shadow-card-hover backdrop-blur sm:-left-8">
              <p className="text-xs font-medium text-navy-400">Skin analysis</p>
              <p className="text-sm font-semibold text-navy-700">AI-graded, private, honest</p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-mist">
        <div className="container-app section-pad grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <img
              src={INTRO_IMG}
              alt="Woman applying skincare in a sunlit room"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-card"
              loading="lazy"
            />
          </Reveal>
          <Reveal delay={100}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-peach-400">
              The platform
            </p>
            <h2 className="mt-3 text-3xl tracking-tight text-navy-700 sm:text-4xl">
              Skincare that starts with understanding
            </h2>
            <p className="mt-5 leading-relaxed text-navy-500">
              Most of us guess our way through skincare. DermaLens replaces guessing with a
              clear picture: an AI model that examines your facial photos, a routine builder
              matched to your skin type and concerns, and everyday guidance on nutrition,
              hydration and sun care — all in one calm, private place.
            </p>
            <p className="mt-4 leading-relaxed text-navy-500">
              Built as a capstone research project, the platform is transparent about what
              its AI can and cannot do. It offers skincare guidance, never medical
              diagnosis.
            </p>
            <Button className="mt-8" onClick={() => navigate('/register')}>
              Create your free account
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="container-app section-pad">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-peach-400">Features</p>
            <h2 className="mt-3 text-3xl tracking-tight text-navy-700 sm:text-4xl">
              Everything your skin needs, in one place
            </h2>
            <p className="mt-4 text-navy-500">
              Six tools that work together — from your first analysis to a routine you
              actually follow.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="group h-full rounded-2xl border border-navy-100 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${f.accent}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-700">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-navy-500">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-powder-100">
        <div className="container-app section-pad">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-500">How it works</p>
            <h2 className="mt-3 text-3xl tracking-tight text-navy-700 sm:text-4xl">
              Three steps to smarter skincare
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.step} delay={i * 100}>
                <div className="relative h-full rounded-3xl bg-white p-8 shadow-card">
                  <span className="absolute right-6 top-6 font-serif text-4xl font-semibold text-navy-100">
                    {s.step}
                  </span>
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-700 text-white">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-700">{s.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-navy-500">{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section id="why-us" className="scroll-mt-20">
        <div className="container-app section-pad grid items-start gap-14 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-peach-400">Why choose us</p>
            <h2 className="mt-3 text-3xl tracking-tight text-navy-700 sm:text-4xl">
              Trustworthy by design
            </h2>
            <p className="mt-4 leading-relaxed text-navy-500">
              Skincare advice is full of exaggeration. We built DermaLens the opposite way:
              honest about what the AI sees, private about your photos, and clear that
              guidance is not a medical diagnosis.
            </p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {whyUs.map((w, i) => (
              <Reveal key={w.title} delay={i * 60}>
                <div className="h-full rounded-2xl bg-mist p-6 transition-colors hover:bg-powder-50">
                  <w.icon className="h-6 w-6 text-navy-500" />
                  <h3 className="mt-4 font-semibold text-navy-700">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{w.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="scroll-mt-20 bg-lavender-100">
        <div className="container-app section-pad">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lavender-500">Testimonials</p>
            <h2 className="mt-3 text-3xl tracking-tight text-navy-700 sm:text-4xl">What users say</h2>
            <p className="mt-3 text-sm font-medium text-navy-500">
              The reviews below are clearly labelled sample content, shown for design
              purposes only.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 60}>
                <figure className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-card">
                  <div className="flex gap-0.5 text-peach-300">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-navy-600">
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="mt-5 border-t border-navy-100 pt-4">
                    <p className="text-sm font-semibold text-navy-700">{t.name}</p>
                    <p className="text-xs text-navy-400">{t.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container-app py-16 sm:py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-navy-700 px-8 py-16 text-center sm:px-16">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lavender-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-peach-400/30 blur-3xl" />
              <h2 className="relative text-3xl tracking-tight text-white sm:text-4xl">
                Ready to meet your skin?
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-navy-100">
                Create a free account and run your first AI skin analysis in minutes.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="relative mt-8"
                onClick={() => navigate(user ? '/dashboard' : '/register')}
              >
                {user ? 'Open Dashboard' : 'Get Started Free'}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
