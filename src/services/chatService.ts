import { supabase } from './supabase';
import { saveChatMessage } from './api';
import type { ChatMessage } from '@/types';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/* Optional AI endpoint — set VITE_AI_CHAT_ENDPOINT in the environment to connect
   a real model. When absent, the assistant runs in clearly-labelled offline mode. */
const AI_ENDPOINT = import.meta.env.VITE_AI_CHAT_ENDPOINT as string | undefined;

interface BuiltInReply {
  keywords: string[];
  reply: string;
  link?: { label: string; to: string };
}

const builtInKnowledge: BuiltInReply[] = [
  {
    keywords: ['routine', 'order', 'step', 'morning', 'night'],
    reply:
      'A simple order works best: cleanse first, then treat (serums), then moisturize, then protect. In the morning always finish with sunscreen SPF 30+; at night skip the sunscreen and use a slightly richer moisturizer. The Routine Builder page creates a full morning and night plan for your skin type.',
  },
  {
    keywords: ['acne', 'breakout', 'pimple', 'spot'],
    reply:
      'For mild breakouts: cleanse gently twice daily, use non-comedogenic products, avoid picking, and consider a salicylic acid or benzoyl peroxide product introduced slowly. If acne is painful or widespread, please see a dermatologist — topical guidance only goes so far.',
  },
  {
    keywords: ['hydrat', 'water', 'dry', 'dehydrat', 'moistur'],
    reply:
      'Hydration is about water in the skin: drink steadily through the day, apply moisturizer to damp skin, and consider a hyaluronic acid serum. In dry or air-conditioned rooms a humidifier helps. Oily skin can be dehydrated too — do not skip moisturizer.',
  },
  {
    keywords: ['sun', 'spf', 'uv', 'sunscreen'],
    reply:
      'Sunscreen is the most important anti-ageing step: SPF 30+ every morning, reapplying every two hours outdoors. UV passes through clouds and windows. About a teaspoon covers face and neck.',
  },
  {
    keywords: ['diet', 'food', 'eat', 'nutrition', 'sugar'],
    reply:
      'Skin-supportive eating basics: colorful fruits and vegetables, omega-3 sources (fish, flaxseed, walnuts), steady hydration, and less very sugary or heavily processed food. Food supports skin health but is not a cure for any condition. The Diet Planner page has full meal ideas.',
  },
  {
    keywords: ['product', 'recommend', 'serum', 'brand', 'buy'],
    reply:
      'I suggest by category rather than brand: look for a gentle cleanser, a treatment serum matching your concern (vitamin C for tone, niacinamide for oil and pores, hyaluronic acid for hydration), a barrier moisturizer, and a broad-spectrum sunscreen. Patch-test anything new for 48 hours.',
  },
  {
    keywords: ['sensitive', 'irritat', 'red', 'itch'],
    reply:
      'For sensitive skin: keep the routine minimal and fragrance-free, use lukewarm (never hot) water, avoid physical scrubs, and prefer mineral sunscreens. If irritation persists or worsens, consult a dermatologist.',
  },
  {
    keywords: ['scar', 'dark spot', 'pigment', 'mark'],
    reply:
      'Dark marks and acne scars fade slowly. Daily sunscreen is essential — UV makes pigmentation worse. Ingredients like niacinamide, azelaic acid and vitamin C can help over months. For deeper scars, dermatologist treatments are far more effective than anything topical.',
  },
];

const fallbackReply =
  'I can help with general skincare topics: routines, acne care, hydration, sun protection, product categories and diet. Try asking about one of those — for example, "What order should I apply products in?" For personal medical concerns, a dermatologist is always the right stop.';

function offlineReply(question: string): string {
  const q = question.toLowerCase();
  const match = builtInKnowledge.find((entry) => entry.keywords.some((k) => q.includes(k)));
  return match ? match.reply : fallbackReply;
}

export async function getAssistantReply(question: string, history: ChatTurn[]): Promise<ChatMessage> {
  if (AI_ENDPOINT) {
    try {
      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ question, history }),
      });
      if (response.ok) {
        const data = (await response.json()) as { reply?: string };
        if (typeof data.reply === 'string' && data.reply.length > 0) {
          return saveChatMessage('assistant', data.reply);
        }
      }
      return saveChatMessage(
        'assistant',
        'Sorry — I could not reach the AI service just now. Please try again in a moment.',
      );
    } catch {
      return saveChatMessage(
        'assistant',
        'Sorry — I could not reach the AI service just now. Please check your connection and try again.',
      );
    }
  }

  /* Offline mode: replies come from a built-in curated knowledge base and are
     clearly labelled as such — we never pretend a live AI generated them. */
  const prefix =
    history.length <= 2
      ? '[Guided answers — demo mode]\n\n'
      : '';
  return saveChatMessage('assistant', `${prefix}${offlineReply(question)}`);
}
