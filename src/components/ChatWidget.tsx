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

  // Configuration for Google Gemini API
  // Best practice: Use environment variable VITE_GEMINI_API_KEY in Vercel
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBfd9R30vzHKmIOcytytKXfPgCNIYXVBno';
  const MODEL = 'gemini-1.5-flash'; // Stable model

  const systemPrompt = `
    Kamu adalah Mody, asisten AI dari Moodlab.
    
    TENTANG MOODLAB:
    Moodlab adalah agensi digital yang didirikan oleh Hengki Setiawan (Mahasiswa Bisnis Digital UNM).
    Fokus utama: Membantu brand (terutama UMKM) membangun relevansi dan loyalitas dengan audiens Gen Z.
    Tagline: "Ubah Popularitas Menjadi Loyalitas".
    Values: Autentik, Data-Driven, Berkualitas.
    
    LAYANAN KAMI:
    1. Konsultasi Pemasaran: Analisis media sosial, website, dan SEO.
    2. Kerjasama Agensi: Pembuatan konten (content creation), pembuatan website, dan manajemen kampanye.
    
    PRODUK DIGITAL:
    1. Template Konten (mulai Rp 50.000): Template meme, carousel, bahan edit video.
    2. E-book (mulai Rp 80.000): Panduan e-commerce, digital marketing, content creation.
    
    GAYA KOMUNIKASI:
    - Nama kamu adalah Mody.
    - Ramah, profesional, tapi santai (Gen Z friendly).
    - Gunakan emoji sesekali agar tidak kaku 😊.
    - Selalu membantu user menemukan solusi terbaik untuk bisnis mereka.
    - Jika ditanya harga spesifik layanan (bukan produk), arahkan untuk konsultasi karena harga variatif tergantung kebutuhan.
    - Jawab dalam Bahasa Indonesia yang baik dan natural.
    
    TUGAS KAMU:
    - Menjawab pertanyaan tentang layanan dan produk Moodlab.
    - Memberikan tips singkat seputar digital marketing jika diminta.
    - Mengarahkan user untuk menghubungi kontak atau melihat halaman layanan/produk jika mereka tertarik.
  `;

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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setError(null);
    setIsTyping(true);

    try {
      // Prepare conversation history for Gemini API
      const contents = newMessages
        .filter(msg => !msg.id.startsWith('bot-') || msg.id.includes('fallback'))
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API Error Details:', errorData);
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const botResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';

      setIsTyping(false);

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      setIsTyping(false);
      console.error('FULL CHATBOT ERROR:', err);

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${errorMessage}. Silakan coba lagi.`);

      const fallbackBotMessage: Message = {
        id: `fallback-${Date.now()}`,
        text: 'Maaf, saya sedang mengalami gangguan koneksi ke server Google. Mohon periksa koneksi internet Anda atau coba lagi nanti.',
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
