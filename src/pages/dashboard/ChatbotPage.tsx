import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  Trash2,
  Info,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { listChatMessages, clearChat, saveChatMessage } from '@/services/api';
import { getAssistantReply } from '@/services/chatService';
import type { ChatMessage } from '@/types';
import { formatTime } from '@/lib/utils';

const suggestedQuestions = [
  'What order should I apply skincare products in?',
  'How can I care for mild breakouts?',
  'How much water should I drink for my skin?',
  'Do I really need sunscreen indoors?',
];

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    listChatMessages()
      .then(setMessages)
      .catch(() => setError('Could not load your chat history.'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || thinking) return;
    setError('');
    setInput('');
    try {
      const userMsg = await saveChatMessage('user', question);
      setMessages((prev) => [...prev, userMsg]);
      setThinking(true);
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await getAssistantReply(question, history);
      /* Simulate natural typing pause so the indicator is visible even offline */
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));
      setMessages((prev) => [...prev, reply]);
    } catch {
      setError('Your message could not be sent. Please try again.');
    } finally {
      setThinking(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleClear = async () => {
    try {
      await clearChat();
      setMessages([]);
    } catch {
      setError('Could not clear the chat. Please try again.');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4 lg:h-[calc(100vh-7rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-600 to-navy-700 text-white shadow-card">
            <Bot className="h-5.5 w-5.5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-navy-700 sm:text-2xl">SkinCare Assistant</h1>
            <p className="text-xs text-navy-400">
              {thinking ? 'Typing…' : 'Online · answers general skincare questions'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-navy-400 hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" /> Clear chat
          </Button>
        )}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Demo mode banner */}
        <div className="flex items-start gap-2.5 border-b border-amber-100 bg-amber-50 px-5 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-800">
            Demo mode: replies come from a built-in set of curated skincare answers, not a
            live AI model. General guidance only — not medical advice.
          </p>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="thin-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-navy-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-powder-100 text-navy-600">
                <Sparkles className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-semibold text-navy-700">Hi! I'm your SkinCare Assistant</h3>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-navy-400">
                Ask me about routines, breakouts, hydration, sun protection or skin-friendly
                eating. Pick a question below or type your own.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user' ? 'bg-navy-700 text-white' : 'bg-peach-100 text-navy-700'
                  }`}
                >
                  {m.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </span>
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${m.role === 'user' ? 'rounded-tr-sm bg-navy-700 text-white' : 'rounded-tl-sm bg-mist text-navy-700'}`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                  <p className={`mt-1.5 text-[10px] ${m.role === 'user' ? 'text-navy-200' : 'text-navy-400'}`}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}

          {thinking && (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach-100 text-navy-700">
                <Bot className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-mist px-4 py-4">
                <span className="h-2 w-2 animate-bounce rounded-full bg-navy-300 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-navy-300 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-navy-300 [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-wrap gap-2 border-t border-navy-100 px-4 py-3 sm:px-6">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-navy-200 bg-white px-3.5 py-1.5 text-xs font-medium text-navy-600 transition-colors hover:border-navy-300 hover:bg-mist"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-navy-100 p-4 sm:px-6">
          {error && <p className="mb-2 text-xs font-medium text-red-500">{error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask a skincare question…"
              className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-navy-200 px-4 py-3 text-sm text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-200"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-navy-700 text-white transition-all hover:bg-navy-600 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-navy-300">
            For medical concerns, consult a dermatologist.{' '}
            <Link to="/dashboard/diet" className="underline hover:text-navy-500">
              See the Diet Planner
            </Link>{' '}
            for nutrition ideas.
          </p>
        </form>
      </Card>
    </div>
  );
}
