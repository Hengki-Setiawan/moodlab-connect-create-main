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

type ChatEvent = { type?: string; content?: string; text?: string; [k: string]: unknown };

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
  const sendUrlAbs = withAction(absWebhookUrl, 'sendMessage');
  const sendUrlProxy = withAction(proxyWebhookUrl, 'sendMessage');
  const storedApiKey = typeof window !== 'undefined' ? localStorage.getItem('ml_n8n_api_key') : null;
  const apiKey = storedApiKey || import.meta.env.VITE_N8N_API_KEY;
  
  // Debug logging
  console.log('Webhook URL abs:', absWebhookUrl);
  console.log('Webhook URL proxy:', proxyWebhookUrl);
  console.log('Send URL abs:', sendUrlAbs);
  console.log('Send URL proxy:', sendUrlProxy);
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
      const primaryUrl = sendUrlProxy;
      try {
        response = await doPost(primaryUrl, true);
      } catch (e1) {
        response = null;
      }

      if (!response.ok) {
        if (response && response.status >= 400 && response.status < 500) {
          try {
            response = await doPost(primaryUrl, false);
          } catch (e3) {
            response = null;
          }
        }

        if (!response || !response.ok) {
          // Fallback: coba endpoint absolut jika proxy gagal (produksi) atau sebaliknya
          const altUrl = primaryUrl === sendUrlProxy ? sendUrlAbs : sendUrlProxy;
          try {
            response = await doPost(altUrl, true);
          } catch {}
          if (!response || !response.ok) {
          if (response.status === 401 || response.status === 403) {
            const newKey = typeof window !== 'undefined' ? window.prompt('API key bermasalah. Masukkan API key n8n:') : null;
            if (newKey) {
              localStorage.setItem('ml_n8n_api_key', newKey);
              // Retry with new key
              return sendMessage(text);
            }
            const errText = response ? await response.text().catch(() => '') : '';
            throw new Error(errText || 'API key tidak valid atau akses ditolak.');
          }
          const errBody = response ? await response.text().catch(() => '') : '';
          throw new Error(errBody || (response ? `HTTP error! status: ${response.status}` : 'Network failed'));
          }
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
      console.log('n8n response:', data);
      
      // Simulate typing delay for natural feel
      setTimeout(() => {
        setIsTyping(false);
        
        // Handle different response formats from n8n
        let botResponse = '';
        if (typeof data === 'string') {
          botResponse = data as string;
        } else {
          const d = (data ?? {}) as Record<string, unknown>;
          if (typeof d.response === 'string') {
            botResponse = d.response as string;
          } else if (typeof d.message === 'string') {
            botResponse = d.message as string;
          } else if (typeof d.text === 'string') {
            botResponse = d.text as string;
          } else if (typeof d.content === 'string') {
            botResponse = d.content as string;
          } else if (typeof d.output === 'string') {
            botResponse = d.output as string;
          } else if (typeof d.chatOutput === 'string') {
            botResponse = d.chatOutput as string;
          } else if (typeof d.answer === 'string') {
            botResponse = d.answer as string;
          } else if (Array.isArray(d.replies) && d.replies.length > 0 && typeof d.replies[0] === 'string') {
            botResponse = d.replies[0] as string;
          } else {
            botResponse = 'Maaf, saya tidak mengerti pertanyaan Anda. Silakan coba lagi.';
          }
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
                    ref={inputRef}
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
                  <Send className="w-4 h-4" />
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
