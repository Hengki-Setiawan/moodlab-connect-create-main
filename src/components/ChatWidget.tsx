import { useEffect, useState, useRef } from 'react';
import { Send, MessageCircle, X, User, Bot } from 'lucide-react';
import './ChatWidget.css';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const webhookUrl = import.meta.env.VITE_N8N_CHAT_URL ? `${import.meta.env.VITE_N8N_CHAT_URL}/chat` : 'https://gwu0a4k-n8n.bocindonesia.com/webhook/1295d2c4-5439-4a3c-b1bf-3bb35a4e281e/chat';
  const storedApiKey = typeof window !== 'undefined' ? localStorage.getItem('ml_n8n_api_key') : null;
  const apiKey = storedApiKey || import.meta.env.VITE_N8N_API_KEY;
  
  // Debug logging
  console.log('Webhook URL:', webhookUrl);
  console.log('API Key available:', !!apiKey);

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
      // Check if webhook URL is available
      if (!webhookUrl) {
        throw new Error('Endpoint webhook tidak dikonfigurasi dengan benar.');
      }

      // Build request headers - support both API key and no-auth modes
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Only add auth headers if API key is available
      if (apiKey) {
        headers['X-N8N-API-KEY'] = apiKey;
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Try standard n8n Hosted Chat payload format first
      let response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chatInput: text.trim(),
          metadata: {
            sessionId: 'user-session',
            timestamp: new Date().toISOString(),
            userId: 'anonymous'
          }
        })
      });

      if (!response.ok) {
        // Coba format payload alternatif untuk kompatibilitas
        if (response.status >= 400 && response.status < 500) {
          response = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              text: text.trim(),
              sessionId: 'user-session',
              message: text.trim()
            })
          });
        }

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            const newKey = typeof window !== 'undefined' ? window.prompt('API key bermasalah. Masukkan API key n8n:') : null;
            if (newKey) {
              localStorage.setItem('ml_n8n_api_key', newKey);
              // Retry with new key
              return sendMessage(text);
            }
            const errText = await response.text().catch(() => '');
            throw new Error(errText || 'API key tidak valid atau akses ditolak.');
          }
          const errBody = await response.text().catch(() => '');
          throw new Error(errBody || `HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json().catch(() => ({ text: 'Maaf, sistem mengirim respons yang tidak terduga.' }));
      
      // Simulate typing delay for natural feel
      setTimeout(() => {
        setIsTyping(false);
        
        // Handle different response formats from n8n
        let botResponse = '';
        if (typeof data === 'string') {
          botResponse = data;
        } else if (data.response) {
          botResponse = data.response;
        } else if (data.message) {
          botResponse = data.message;
        } else if (data.text) {
          botResponse = data.text;
        } else if (data.output) {
          botResponse = data.output;
        } else if (data.chatOutput) {
          botResponse = data.chatOutput;
        } else {
          botResponse = 'Maaf, saya tidak mengerti pertanyaan Anda. Silakan coba lagi.';
        }

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
      
      // Log error for debugging
      console.error('Chatbot error:', err);
      
      // Create user-friendly error message
      let errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.';
      
      if (err instanceof Error) {
        if (err.message.includes('API key')) {
          errorMessage = 'Terjadi masalah dengan konfigurasi. Silakan hubungi administrator.';
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Koneksi bermasalah. Periksa koneksi internet Anda.';
        } else if (err.message.includes('NetworkError')) {
          errorMessage = 'Tidak dapat terhubung ke server. Coba lagi nanti.';
        }
      }
      
      setError(errorMessage);
      
      // Fallback response for demo purposes
      const fallbackResponses = [
        'Maaf, saya sedang mengalami gangguan koneksi. Silakan coba lagi dalam beberapa saat.',
        'Saya tidak dapat terhubung ke server saat ini. Mohon coba lagi nanti.',
        'Terjadi masalah teknis. Tim kami sedang memperbaikinya.'
      ];
      
      const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      // Add fallback message to chat
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

  const positionStyles = {
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' },
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className={`chat-widget-container ${position}`}>
          <button
            onClick={() => setIsOpen(true)}
            className="chat-button"
            aria-label="Buka chat"
          >
            <MessageCircle />
            <span className="notification-badge">1</span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chat-widget-container ${position}`}>
          <div className="chat-window">
            {/* Header */}
            <div className="chat-header">
            <div className="header-content">
              <div className="header-icon">
                <Bot className="w-4 h-4" />
              </div>
              <div className="header-text">
                <h3 className="header-title">{title}</h3>
              </div>
            </div>
              <div className="header-actions">
                <button
                  onClick={() => setIsOpen(false)}
                  className="header-button"
                  aria-label="Tutup chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender}`}
                  >
                    <div className="message-avatar">
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className="message-content">
                      <p>{message.text}</p>
                      <div className="message-time">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="message bot">
                    <div className="message-avatar">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="error-state">
                  <div className="error-icon">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="error-message">{error}</div>
                  <button className="retry-button" onClick={() => setError(null)}>
                    Coba Lagi
                  </button>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area">
              <form onSubmit={handleSubmit} className="input-container">
                <div className="input-wrapper">
                  <textarea
                    ref={inputRef as any}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="message-input"
                    disabled={isTyping}
                    rows={1}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="send-button"
                  aria-label="Kirim pesan"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;