import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translate, type Language, languages } from '@/i18n/translations';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState<Language>('en');

  // Load saved language: profile first, then local fallback.
  useEffect(() => {
    const saved = localStorage.getItem('dermalens-lang') as Language | null;
    if (saved && languages.some((l) => l.value === saved)) setLangState(saved);
    if (!user) return;
    supabase
      .from('profiles')
      .select('language')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.language && languages.some((l) => l.value === data.language)) {
          setLangState(data.language as Language);
        }
      })
      .catch(() => undefined);
  }, [user]);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('dermalens-lang', l);
    if (user) {
      supabase
        .from('profiles')
        .upsert({ id: user.id, language: l })
        .then(() => undefined)
        .catch(() => undefined);
    }
  };

  const t = (key: string) => translate(lang, key);

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
