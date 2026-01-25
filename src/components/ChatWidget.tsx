import { useEffect, useState, useRef } from 'react';
import { Send, MessageCircle, X, User, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatWidget.css';
import ModyAvatar from '@/assets/mody-avatar.png';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatWidgetProps {
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  title?: string;
  subtitle?: string;
  placeholder?: string;
  initialMessages?: string[];
}

type ChatEvent = { type?: string; content?: string; text?: string;[k: string]: unknown };

const ChatWidget = ({
  primaryColor = '#7C3AED',
  position = 'bottom-right',
  title = 'Moodlab Assistant',
  subtitle = 'AI Chatbot',
  placeholder = 'Tulis pertanyaanmu...',
  initialMessages = ['Halo saya Mody, AI chat bot dari Moodlab 😊', 'Ada yang bisa saya bantu?']
}: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const requireAuth = (import.meta.env.VITE_N8N_AUTH_MODE || 'none') !== 'none';
  const envChatBase = import.meta.env.VITE_N8N_CHAT_URL as string | undefined;
  const absWebhookUrl = envChatBase
    ? (envChatBase.replace(/\/$/, '').endsWith('/chat') ? envChatBase.replace(/\/$/, '') : `${envChatBase.replace(/\/$/, '')}/chat`)
    : 'https://gwu0a4k-n8n.bocindonesia.com/webhook/1295d2c4-5439-4a3c-b1bf-3bb35a4e281e/chat';
  const proxyWebhookUrl = '/n8n-chat/chat';
  const withAction = (url: string, action: string) => `${url}${url.includes('?') ? '&' : '?'}action=${action}`;
  const sendUrlProxy = withAction(proxyWebhookUrl, 'sendMessage');
  const storedApiKey = typeof window !== 'undefined' ? localStorage.getItem('ml_n8n_api_key') : null;
  const apiKey = storedApiKey || import.meta.env.VITE_N8N_API_KEY;

  // Initialize messages when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialBotMessages: Message[] = initialMessages.map((text, index) => ({
        id: `bot-${Date.now()}-${index}`,
        text,
        sender: 'bot',
        timestamp: new Date(Date.now() - (initialMessages.length - index) * 1000)
      }));
      setMessages(initialBotMessages);
    }
  }, [isOpen, messages.length, initialMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setError(null);

    // Show typing indicator
    setIsTyping(true);

    try {
      if (!absWebhookUrl) {
        throw new Error('Endpoint webhook tidak dikonfigurasi dengan benar.');
      }

      // Build request headers - support both API key and no-auth modes
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      };

      // Only add auth headers if required
      if (requireAuth && apiKey) {
        headers['X-N8N-API-KEY'] = apiKey;
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const doPost = (url: string, usePrimaryPayload: boolean) => {
        return fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            chatInput: usePrimaryPayload ? text.trim() : undefined,
            sessionId: 'user-session',
            timestamp: new Date().toISOString(),
            userId: 'anonymous',
            message: usePrimaryPayload ? undefined : text.trim(),
            metadata: usePrimaryPayload ? undefined : {
              sessionId: 'user-session',
              timestamp: new Date().toISOString(),
              userId: 'anonymous'
            }
          })
        });
      };

      let response: Response | null = null;
      try {
        response = await doPost(sendUrlProxy, true);
      } catch (e1) {
        response = null;
      }

      if (!response || !response.ok) {
        if (response && response.status >= 400 && response.status < 500) {
          try {
            response = await doPost(sendUrlProxy, false);
          } catch (e3) {
            response = null;
          }
        }

        if (!response || !response.ok) {
          if (response && (response.status === 401 || response.status === 403)) {
            const newKey = typeof window !== 'undefined' ? window.prompt('API key bermasalah. Masukkan API key n8n:') : null;
            if (newKey) {
              localStorage.setItem('ml_n8n_api_key', newKey);
              return sendMessage(text);
            }
            const errText = response ? await response.text().catch(() => '') : '';
            throw new Error(errText || 'API key tidak valid atau akses ditolak.');
          }
          const errBody = response ? await response.text().catch(() => '') : '';
          throw new Error(errBody || (response ? `HTTP error! status: ${response.status}` : 'Network failed'));
        }
      }

      let data: unknown = null;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let s = '';
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          s += decoder.decode(chunk.value, { stream: true });
        }
        s += decoder.decode();
        const normalized = s.replace(/\}\s+\{/g, '}\n{');
        const lines = normalized.split(/\r?\n/).filter(Boolean);
        const payloads: ChatEvent[] = [];
        for (const line of lines) {
          const raw = line.startsWith('data:') ? line.slice(5).trim() : line.trim();
          if (!raw) continue;
          try { payloads.push(JSON.parse(raw) as ChatEvent); } catch { payloads.push({ text: raw }); }
        }
        const items = payloads.filter((p) => p && (p as ChatEvent).type === 'item');
        const joined = items
          .map((p) => {
            const ev = p as ChatEvent;
            return typeof ev.content === 'string' ? ev.content : (typeof ev.text === 'string' ? ev.text : '');
          })
          .filter(Boolean)
          .join('');
        if (joined) {
          data = { text: joined };
        } else {
          const lastItem = [...payloads].reverse().find((p) => p && (p as ChatEvent).type === 'item') as ChatEvent | undefined;
          data = lastItem && typeof lastItem!.content === 'string'
            ? { text: lastItem!.content as string }
            : (payloads[payloads.length - 1] || { text: s });
        }
      } else {
        const clone = response.clone();
        const txtRaw = await clone.text().catch(() => '');
        const txt = txtRaw.replace(/\}\s+\{/g, '}\n{');
        const matches = Array.from(txt.matchAll(/"type":"item"[\s\S]*?"content":"([^"]+)"/g));
        const joinedText = matches.map((m) => m[1]).join('');
        if (joinedText) {
          data = { text: joinedText };
        } else {
          try {
            data = txt ? JSON.parse(txt) : await response.json();
          } catch {
            data = txt ? { text: txt } : { text: 'Maaf, sistem mengirim respons yang tidak terduga.' };
          }
        }
      }

      // Simulate typing delay for natural feel
      setTimeout(() => {
        setIsTyping(false);

        // Handle different response formats from n8n
        let botResponse = '';
        if (typeof data === 'string') {
          botResponse = data as string;
        } else {
          const d = (data ?? {}) as Record<string, unknown>;
          if (typeof d.response === 'string') botResponse = d.response;
          else if (typeof d.message === 'string') botResponse = d.message;
          else if (typeof d.text === 'string') botResponse = d.text;
          else if (typeof d.content === 'string') botResponse = d.content;
          else if (typeof d.output === 'string') botResponse = d.output;
          else if (typeof d.chatOutput === 'string') botResponse = d.chatOutput;
          else if (typeof d.answer === 'string') botResponse = d.answer;
          else if (Array.isArray(d.replies) && d.replies.length > 0 && typeof d.replies[0] === 'string') botResponse = d.replies[0];
          else botResponse = 'Maaf, saya tidak mengerti pertanyaan Anda. Silakan coba lagi.';
        }
        const sanitizeText = (raw: string): string => {
          let s = raw;
          s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
          s = s.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, ' ');
          s = s.replace(/\*\*/g, '').replace(/\*/g, '');
          s = s.replace(/\\(?![nrtu])/g, '');
          s = s.replace(/[ \t]+/g, ' ');
          s = s.replace(/\n{3,}/g, '\n\n');
          return s.trim();
        };
        botResponse = sanitizeText(botResponse);

        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }, 1000);

    } catch (err) {
      setIsTyping(false);
      console.error('Chatbot error:', err);
      let errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.';
      if (err instanceof Error) {
        if (err.message.includes('API key')) errorMessage = 'Terjadi masalah dengan konfigurasi. Silakan hubungi administrator.';
        else if (err.message.includes('fetch')) errorMessage = 'Koneksi bermasalah. Periksa koneksi internet Anda.';
        else if (err.message.includes('NetworkError')) errorMessage = 'Tidak dapat terhubung ke server. Coba lagi nanti.';
      }
      setError(errorMessage);

      const fallbackResponses = [
        'Maaf, saya sedang mengalami gangguan koneksi. Silakan coba lagi dalam beberapa saat.',
        'Saya tidak dapat terhubung ke server saat ini. Mohon coba lagi nanti.',
        'Terjadi masalah teknis. Tim kami sedang memperbaikinya.'
      ];
      const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

      const fallbackBotMessage: Message = {
        id: `fallback-${Date.now()}`,
        text: randomFallback,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackBotMessage]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`fixed z-50 ${positionClasses[position]}`}
          >
            <button
              onClick={() => setIsOpen(true)}
              className="relative group flex items-center justify-center w-14 h-14 rounded-full gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label="Buka chat"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75 group-hover:opacity-100 duration-1000" />
              <MessageCircle className="w-7 h-7 text-white relative z-10" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white z-20">
                1
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 ${positionClasses[position]} w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh]`}
          >
            <div className="flex flex-col h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 gradient-primary text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
                    <img src={ModyAvatar} alt="Mody" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{title}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs opacity-90">Online</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {messages.map((message) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {message.sender === 'user' ? (
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-200 flex-shrink-0 bg-white">
                        <img src={ModyAvatar} alt="Mody" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`p-3 rounded-2xl text-sm ${message.sender === 'user'
                        ? 'gradient-primary text-white rounded-tr-sm shadow-md'
                        : 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-tl-sm shadow-sm'
                        }`}>
                        {message.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-200 flex-shrink-0 bg-white">
                      <img src={ModyAvatar} alt="Mody" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-2 h-2 bg-primary/40 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="w-2 h-2 bg-primary/40 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          className="w-2 h-2 bg-primary/40 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-center"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800">
                <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="w-full pl-4 pr-12 py-3 bg-white dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 rounded-full focus:ring-2 focus:ring-primary/50 resize-none text-sm shadow-sm scrollbar-hide"
                    disabled={isTyping}
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '100px' }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className="absolute right-2 p-2 gradient-primary rounded-full text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
