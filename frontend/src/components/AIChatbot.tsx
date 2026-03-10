import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Bot, Beer, Loader2, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BeerData } from '../types/beer';
import type { ChatMessage, WeatherData } from '../lib/ollama';
import { chatWithAI, buildSystemPrompt, fetchWeather } from '../lib/ollama';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_SUGGESTIONS = [
  'Welk bier past bij dit weer?',
  'Welk bier is geschikt voor beginners?',
  'Wat is jullie sterkste bier?',
  'Aanbeveling voor een IPA liefhebber',
  'Wat past goed bij een hamburger?',
];

const WELCOME_MESSAGE =
  'Hey! Ik ben BeerBot 🍺 Ik help je graag het perfecte biertje te vinden op onze kaart. Stel me gerust een vraag of vertel me wat voor bier je lekker vindt!';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [beersReady, setBeersReady] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchBeers = async () => {
      try {
        let response;
        try {
          response = await fetch('/api/beers?limit=1000');
        } catch {
          response = await fetch('/beers.json');
        }
        const data = await response.json();
        setBeers(data.beers || []);
        setBeersReady(true);
      } catch {
        setBeersReady(true);
      }
    };
    const loadWeather = async () => {
      const data = await fetchWeather();
      setWeather(data);
    };
    fetchBeers();
    loadWeather();
    // Refresh weather every 10 minutes
    const weatherInterval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, []);

  const buildConversationHistory = useCallback(
    (userMessages: Message[]): ChatMessage[] => {
      const history: ChatMessage[] = [];

      if (beers.length > 0) {
        history.push({ role: 'system', content: buildSystemPrompt(beers, weather) });
      }

      userMessages.forEach(msg => {
        if (msg.id !== 'welcome') {
          history.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
        }
      });

      return history;
    },
    [beers, weather]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput('');
      setIsLoading(true);

      try {
        const history = buildConversationHistory(updatedMessages);
        const response = await chatWithAI(history);

        setMessages(prev => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: response },
        ]);

        if (!isOpen) setHasUnread(true);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Er is iets misgegaan. Probeer het opnieuw.';
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Sorry, er is een fout opgetreden: ${errorMsg}`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, isOpen, buildConversationHistory]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const showSuggestions = messages.length === 1 && !isLoading;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[9998]">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={() => setIsOpen(true)}
              className="relative w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              aria-label="Open BeerBot chat"
            >
              <MessageCircle className="w-7 h-7 text-white" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
              )}
              <span className="absolute inset-0 rounded-2xl animate-ping bg-amber-400 opacity-20" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-[9998] w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 shrink-0">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Beer className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm leading-tight">BeerBot</h3>
                <p className="text-amber-100 text-xs truncate">
                  {beersReady
                    ? weather
                      ? `${weather.description} · ${weather.temperature}°C · ${beers.length} bieren`
                      : `${beers.length} bieren op de kaart`
                    : 'Kaart wordt geladen…'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                aria-label="Sluit chat"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 overscroll-contain">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {isLoading && <TypingIndicator />}

              {/* Quick Suggestions */}
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2"
                >
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-medium">
                    Snel beginnen:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SUGGESTIONS.map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestion(suggestion)}
                        className="text-xs px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Stel een vraag over bier…"
                  rows={1}
                  disabled={isLoading || !beersReady}
                  className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all max-h-28 leading-relaxed disabled:opacity-50"
                  style={{ minHeight: '42px' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !beersReady}
                  className="w-10 h-10 shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-300 dark:text-gray-600 mt-2">
                Aangedreven door Ollama AI • Advies kan afwijken
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mb-0.5">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 bg-amber-500 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
