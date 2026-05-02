'use client';

import { cn } from '@/components/ui';
import { api } from '@/lib/api';
import { Loader2, Send, Sun, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  quickReplies?: string[];
}

export default function AiSalesChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [convId, setConvId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [pulsed, setPulsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pulse button after 30s to draw attention
  useEffect(() => {
    const t = setTimeout(() => setPulsed(true), 30_000);
    return () => clearTimeout(t);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      if (messages.length === 0) sendGreeting();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendGreeting = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/sales-chat', { message: 'Привіт' });
      setConvId(data.conversationId);
      setMessages([{ role: 'assistant', content: data.reply, quickReplies: data.quickReplies }]);
    } catch {
      setMessages([{
        role: 'assistant',
        content: 'Доброго дня! Я консультант Solomiya Energy ☀️\n\nПідберемо СЕС спеціально для вас. Станція для **дому** чи **бізнесу**?',
        quickReplies: ['Для дому 🏠', 'Для бізнесу 🏭'],
      }]);
    }
    setLoading(false);
  };

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/sales-chat', { message: text, conversationId: convId });
      setConvId(data.conversationId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        quickReplies: data.quickReplies?.length ? data.quickReplies : undefined,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Вибачте, сталася помилка. Спробуйте ще раз.' }]);
    }
    setLoading(false);
  }, [convId, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* ── Floating button ───────────────────────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3',
            'bg-accent text-black font-semibold text-[13px] rounded-full shadow-lg',
            'hover:bg-[#ffc04a] transition-all duration-200',
            pulsed && 'animate-bounce',
          )}
        >
          <Sun size={16} className="flex-shrink-0" />
          Підібрати СЕС за 1 хв
        </button>
      )}

      {/* ── Chat window ───────────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden border border-border2 bg-surface">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-accent/20 to-accent2/10 border-b border-border">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center flex-shrink-0">
              <Sun size={16} className="text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-text">Solomiya Energy</p>
              <p className="text-[11px] text-success font-medium">● Онлайн — відповідаємо за 30 хв</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-text3 hover:text-text transition-colors p-1">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-[280px] max-h-[400px] bg-bg">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] px-3 py-2.5 rounded-2xl text-[13px] leading-[1.5]',
                  msg.role === 'user'
                    ? 'bg-accent text-black rounded-br-sm'
                    : 'bg-surface2 border border-border text-text rounded-bl-sm',
                )}>
                  <span dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} />
                  {/* Quick replies */}
                  {msg.role === 'assistant' && msg.quickReplies && i === messages.length - 1 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          onClick={() => send(qr)}
                          className="text-[11px] px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full hover:bg-accent/20 transition-colors font-medium"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface2 border border-border px-3 py-2.5 rounded-2xl rounded-bl-sm">
                  <Loader2 size={14} className="animate-spin text-accent" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-surface">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Напишіть повідомлення..."
              className="flex-1 bg-surface2 border border-border2 rounded-full px-3.5 py-2 text-[13px] text-text placeholder:text-text3 outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full bg-accent text-black flex items-center justify-center flex-shrink-0 hover:bg-[#ffc04a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
