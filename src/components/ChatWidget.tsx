import { useEffect, useState, useRef } from 'react';
import { Send, MessageCircle, X, Paperclip, User, Bot } from 'lucide-react';
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
  const apiKey = import.meta.env.VITE_N8N_API_KEY;

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
      // Check if API key is available
      if (!apiKey) {
        throw new Error('API key tidak tersedia. Silakan hubungi administrator.');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': apiKey
        },
        body: JSON.stringify({
          message: text.trim(),
          sessionId: 'user-session',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API key tidak valid. Silakan hubungi administrator.');
        } else if (response.status === 403) {
          throw new Error('Akses ditolak. Silakan hubungi administrator.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
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
      setError('Maaf, terjadi kesalahan. Silakan coba lagi.');
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
                  <p className="header-subtitle">{subtitle}</p>
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
                  <div className="input-actions">
                    <button
                      type="button"
                      className="input-button"
                      aria-label="Lampirkan file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
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