import { useEffect, useState } from "react";
import "@n8n/chat/style.css";
import "@/chat-widget.css";
import { createChat } from "@n8n/chat";

const ChatWidget = () => {
  const isDev = import.meta.env.DEV;
  const apiKey = import.meta.env.VITE_N8N_API_KEY as string | undefined;
  const rawWebhook = isDev ? "/n8n-chat" : (import.meta.env.VITE_N8N_CHAT_URL as string | undefined);
  const webhookUrl = (() => {
    if (!rawWebhook) return undefined as any;
    const s = String(rawWebhook);
    return /\/chat(\/?|$)/i.test(s) ? s : (s.endsWith("/") ? `${s}chat` : `${s}/chat`);
  })();

  const [isOpen, setIsOpen] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  useEffect(() => {
    if (!webhookUrl || !isOpen) return;
    try {
      const container = document.querySelector("#ml-chat-content");
      const already = !!container && !!container.firstElementChild;
      if (already) return;
      createChat({
        webhookUrl,
        webhookConfig: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "X-N8N-API-KEY": apiKey } : {}),
          },
        },
        target: "#ml-chat-content",
        mode: "fullscreen",
        showWelcomeScreen: false,
        loadPreviousSession: true,
        enableStreaming: true,
        allowFileUploads: true,
        allowedFilesMimeTypes: "image/*,application/pdf",
        initialMessages: ["Halo saya Mody, AI chat bot dari Moodlab 😊", "Ada yang bisa saya bantu?"],
        i18n: { en: { title: "Moodlab Assistant", subtitle: "", inputPlaceholder: "Tulis pertanyaanmu..." } },
      });
      setUiError(null);
    } catch {
      setUiError("Gagal memuat chat. Coba lagi atau cek koneksi.");
    }
  }, [webhookUrl, isOpen, apiKey]);

  // Sembunyikan pesan error "Error: Unknown error"
  useEffect(() => {
    if (!isOpen) return;
    
    const hideErrorMessages = () => {
      const messages = document.querySelectorAll('#ml-chat-content [class*="message"], #ml-chat-content [class*="bubble"], #n8n-chat [class*="message"], #n8n-chat [class*="bubble"]');
      messages.forEach(msg => {
        if (msg.textContent?.includes('Error: Unknown error')) {
          (msg as HTMLElement).style.display = 'none';
        }
      });
    };

    // Sembunyikan error yang sudah ada
    hideErrorMessages();
    
    // Observer untuk menyembunyikan error baru
    const observer = new MutationObserver(hideErrorMessages);
    const container = document.querySelector('#ml-chat-content');
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }
    
    return () => observer.disconnect();
  }, [isOpen]);

  const winW = (import.meta.env.VITE_CHAT_WIDGET_WIDTH as string | undefined) || "";
  const winH = (import.meta.env.VITE_CHAT_WIDGET_HEIGHT as string | undefined) || "";

  return (
    <div id="ml-chat-widget">
      {isOpen && (
        <div className="ml-widget-window" role="dialog" aria-label="Widget Chatbot" aria-modal="false" style={{ width: winW || undefined, height: winH || undefined }}>
          <div className="ml-widget-body">
            <div id="ml-chat-content" />
            {uiError && <div className="ml-error-bubble">{uiError}</div>}
            <button className="ml-widget-close" aria-label="Tutup chat" onClick={() => setIsOpen(false)}>✕</button>
          </div>
        </div>
      )}
      {!isOpen && (
        <button className="ml-widget-launcher" aria-label="Buka chatbot" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 5a3 3 0 013-3h10a3 3 0 013 3v9a3 3 0 01-3 3H11l-4 4v-4H7a3 3 0 01-3-3V5z" fill="white"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;