import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, MessageCircle, X, User, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import './ChatWidget.css';
import ModyAvatar from '@/assets/mody-avatar.png';
import { fetchChatbotContext } from '@/services/chatbotService';

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
  placeholder?: string;
  initialMessages?: string[];
}

const ChatWidget = ({
  position = 'bottom-right',
  title = 'Moodlab Assistant',
  placeholder = 'Tulis pertanyaanmu...',
  initialMessages = ['Halo! Saya Mody, asisten pintar Moodlab 😊', 'Saya bisa menjawab pertanyaan tentang produk dan layanan kami. Ada yang bisa saya bantu?']
}: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productContext, setProductContext] = useState<string>('');
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Configuration for Google Gemini API - NO FALLBACK, must be in .env
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // List of models to try in order of preference
  const MODELS_TO_TRY = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash'
  ];

  // Check for API key on mount
  useEffect(() => {
    if (!GEMINI_API_KEY) {
      setApiKeyMissing(true);
      console.error('VITE_GEMINI_API_KEY is not set in environment variables.');
    }
  }, [GEMINI_API_KEY]);

  // Fetch product context when chat opens
  const loadContext = useCallback(async () => {
    if (productContext) return; // Already loaded
    setIsLoadingContext(true);
    try {
      const context = await fetchChatbotContext();
      setProductContext(context);
    } catch (err) {
      console.error('Failed to load product context:', err);
    } finally {
      setIsLoadingContext(false);
    }
  }, [productContext]);

  // Build the full system prompt with real data
  const buildSystemPrompt = useCallback(() => {
    return `
Kamu adalah Mody, asisten AI PINTAR dari Moodlab yang TERKONEKSI ke database produk real-time.

TENTANG MOODLAB:
Moodlab adalah agensi digital yang didirikan oleh Hengki Setiawan (Mahasiswa Bisnis Digital UNM).
Fokus utama: Membantu brand (terutama UMKM) membangun relevansi dan loyalitas dengan audiens Gen Z.
Tagline: "Ubah Popularitas Menjadi Loyalitas".
Values: Autentik, Data-Driven, Berkualitas.

LAYANAN KAMI:
1. Konsultasi Pemasaran: Analisis media sosial, website, dan SEO.
2. Kerjasama Agensi: Pembuatan konten (content creation), pembuatan website, dan manajemen kampanye.

${productContext}

GAYA KOMUNIKASI:
- Nama kamu adalah Mody.
- Ramah, profesional, tapi santai (Gen Z friendly).
- Gunakan emoji sesekali agar tidak kaku 😊.
- SELALU gunakan data produk di atas untuk menjawab pertanyaan tentang harga atau produk.
- Jika ditanya harga spesifik LAYANAN (bukan produk digital), arahkan untuk konsultasi karena harga variatif.
- Jawab dalam Bahasa Indonesia yang baik dan natural.

TUGAS KAMU:
- Menjawab pertanyaan tentang layanan dan produk Moodlab BERDASARKAN DATA DI ATAS.
- Memberikan tips singkat seputar digital marketing jika diminta.
- Mengarahkan user untuk menghubungi kontak atau melihat halaman layanan/produk jika mereka tertarik.
`;
  }, [productContext]);

  // Initialize messages when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadContext();
      const initialBotMessages: Message[] = initialMessages.map((text, index) => ({
        id: `bot-${Date.now()}-${index}`,
        text,
        sender: 'bot',
        timestamp: new Date(Date.now() - (initialMessages.length - index) * 1000)
      }));
      setMessages(initialBotMessages);
    }
  }, [isOpen, messages.length, initialMessages, loadContext]);

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
    if (!text.trim() || apiKeyMissing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setError(null);
    setIsTyping(true);

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

      const history = newMessages
        .filter(msg => !msg.id.startsWith('bot-') || msg.id.includes('response'))
        .slice(0, -1)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      let botResponseText = '';
      let lastError: Error | null = null;

      for (const modelName of MODELS_TO_TRY) {
        try {
          console.log(`[Mody] Trying model: ${modelName}`);

          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: buildSystemPrompt(),
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
          });

          const chat = model.startChat({
            history: history,
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7,
            },
          });

          const result = await chat.sendMessage(text);
          const response = await result.response;
          botResponseText = response.text();

          if (botResponseText) {
            console.log(`[Mody] Success with model: ${modelName}`);
            break;
          }
        } catch (err) {
          console.warn(`[Mody] Failed with model ${modelName}:`, err);
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      if (!botResponseText) {
        throw lastError || new Error('Semua model gagal merespons');
      }

      setIsTyping(false);

      const botMessage: Message = {
        id: `response-${Date.now()}`,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      setIsTyping(false);
      console.error('[Mody] Chatbot Error:', err);

      let friendlyError = 'Maaf, terjadi kesalahan. Silakan coba lagi.';
      if (err instanceof Error) {
        if (err.message.includes('API_KEY_INVALID') || err.message.includes('API key')) {
          friendlyError = 'API Key tidak valid. Silakan hubungi admin.';
        } else if (err.message.includes('quota') || err.message.includes('rate')) {
          friendlyError = 'Kuota API habis. Coba lagi nanti.';
        }
      }
      setError(friendlyError);

      const fallbackBotMessage: Message = {
        id: `fallback-${Date.now()}`,
        text: 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi atau hubungi kami langsung via WhatsApp.',
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
                      {isLoadingContext ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs opacity-90">Memuat data...</span>
                        </>
                      ) : apiKeyMissing ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-yellow-300" />
                          <span className="text-xs opacity-90">Offline</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-xs opacity-90">Online • Terhubung ke Database</span>
                        </>
                      )}
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

              {/* API Key Warning */}
              {apiKeyMissing && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                    ⚠️ Chatbot tidak aktif. Harap set VITE_GEMINI_API_KEY di file .env
                  </p>
                </div>
              )}

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
                      Tutup
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
                    placeholder={apiKeyMissing ? 'Chatbot tidak aktif...' : placeholder}
                    className="w-full pl-4 pr-12 py-3 bg-white dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 rounded-full focus:ring-2 focus:ring-primary/50 resize-none text-sm shadow-sm scrollbar-hide disabled:opacity-50"
                    disabled={isTyping || apiKeyMissing}
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '100px' }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping || apiKeyMissing}
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
