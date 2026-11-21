import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Stethoscope } from 'lucide-react';
import Logo from '@/components/Logo';

const content: Record<string, { icon: typeof FileText; title: string; intro: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    icon: ShieldCheck,
    title: 'Privacy Policy',
    intro:
      'How AcneLyze handles your personal information and facial photos.',
    sections: [
      {
        heading: 'What we store',
        body: 'Your account email, the profile details you choose to provide (skin type, concerns, preferences), your analysis records and uploaded photos, your daily checklist, and your chat messages with the assistant.',
      },
      {
        heading: 'Photo privacy',
        body: 'Facial photos are stored in a private storage bucket. Access is restricted at the database level so that only your signed-in account can view or download your own images. No other user, and no public access, is possible.',
      },
      {
        heading: 'How we use data',
        body: 'Your data is used solely to operate the platform: showing your dashboard, running analyses when the AI model is connected, and personalizing routines and tips. We do not sell your data or use your photos for advertising.',
      },
      {
        heading: 'Your control',
        body: 'You can delete any analysis together with its photo at any time from Analysis History. Clearing the chat removes your messages. Deleting your account removes associated data.',
      },
    ],
  },
  terms: {
    icon: FileText,
    title: 'Terms of Service',
    intro: 'The ground rules for using AcneLyze.',
    sections: [
      {
        heading: 'The service',
        body: 'AcneLyze provides AI-assisted skincare guidance: facial photo analysis, routine recommendations, beauty tips, diet suggestions and a skincare assistant chatbot.',
      },
      {
        heading: 'Acceptable use',
        body: 'Upload only photos of yourself or of people who have given you permission. Do not attempt to access other users\u2019 data, upload prohibited content, or misuse the platform in ways that impair it for others.',
      },
      {
        heading: 'No warranty',
        body: 'The platform is provided as an educational capstone project. Guidance is generated from general skincare knowledge and, where connected, an AI model. It is provided "as is" without warranties of any kind.',
      },
      {
        heading: 'Account responsibility',
        body: 'Keep your credentials confidential. You are responsible for activity under your account.',
      },
    ],
  },
  disclaimer: {
    icon: Stethoscope,
    title: 'Medical Disclaimer',
    intro: 'What AcneLyze is — and, importantly, what it is not.',
    sections: [
      {
        heading: 'Not a medical device',
        body: 'AcneLyze does not diagnose, treat, cure or prevent any disease or skin condition. Output from the analysis feature is an automated, non-clinical observation of a photo, not a medical finding.',
      },
      {
        heading: 'No fabricated results',
        body: 'The platform only ever displays analysis results returned by its actual backend model. While the model is not connected, analyses remain in a clearly labelled pending/demo state — we never invent predictions.',
      },
      {
        heading: 'Seek professional care',
        body: 'For painful, sudden, spreading or persistent skin problems — including severe acne — consult a dermatologist or physician. Likewise, the diet planner offers general nutrition ideas and does not replace advice from a doctor or registered dietitian.',
      },
      {
        heading: 'Emergency note',
        body: 'If you experience a severe allergic reaction, rapid skin necrosis, or other urgent symptoms, seek emergency medical care immediately.',
      },
    ],
  },
};

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? content[slug] : undefined;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-navy-100">
        <div className="container-app flex h-16 items-center justify-between sm:h-[72px]">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="container-app max-w-3xl py-14 sm:py-20">
        {page ? (
          <>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-powder-100 text-navy-600">
                <page.icon className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-3xl tracking-tight text-navy-700">{page.title}</h1>
                <p className="mt-1 text-sm text-navy-400">{page.intro}</p>
              </div>
            </div>
            <div className="mt-10 space-y-8">
              {page.sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="text-lg font-semibold text-navy-700">{s.heading}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.body}</p>
                </section>
              ))}
            </div>
            <p className="mt-12 rounded-2xl bg-mist p-5 text-xs leading-relaxed text-navy-400">
              Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}. This
              document is part of a student capstone project and is provided as an example
              policy, not as legal advice.
            </p>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl text-navy-700">Page not found</h1>
            <Link to="/" className="mt-4 inline-block font-semibold text-navy-600 hover:underline">
              Return home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
