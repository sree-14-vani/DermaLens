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
    const load = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.language && languages.some((l) => l.value === data.language)) {
          setLangState(data.language as Language);
        }
      } catch {
        /* profile language unavailable */
      }
    };
    load();
  }, [user]);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('dermalens-lang', l);
    if (user) {
      const persist = async () => {
        try {
          await supabase.from('profiles').upsert({ id: user.id, language: l });
        } catch {
          /* keep local language selection */
        }
      };
      persist();
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
