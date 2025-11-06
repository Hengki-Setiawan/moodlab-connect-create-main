
import { useEffect } from "react";
import "@n8n/chat/style.css";
import "@/chat-widget.css";
import { createChat } from "@n8n/chat";

 const ChatWidget = () => {
   // Saat development, gunakan proxy lokal untuk menghindari CORS
   const isDev = import.meta.env.DEV;
   const apiKey = import.meta.env.VITE_N8N_API_KEY as string | undefined;
   const webhookUrl = isDev ? "/n8n-chat" : import.meta.env.VITE_N8N_CHAT_URL;

  useEffect(() => {
    if (!webhookUrl) {
      console.warn("[ChatWidget] Missing VITE_N8N_CHAT_URL env var. Chat will not be initialized.");
      return;
    }

    // @ts-expect-error - simple global flag to prevent re-initialization
    if (window.__mlN8nChatInited) {
      console.log("[ChatWidget] Skipping initialization: already initialized.");
      return;
    }

     try {
      createChat({
        webhookUrl,
        webhookConfig: {
          method: "POST",
          headers: apiKey ? { "X-API-Key": apiKey } : {},
        },
        target: "#moodlab-n8n-chat-container",
        mode: "window",
        showWelcomeScreen: false,
        loadPreviousSession: false,
        initialMessages: ["Halo! 👋", "Ada yang bisa saya bantu?"],
        i18n: {
          en: {
            title: "Moodlab Assistant",
            subtitle: "Kami siap membantu pertanyaanmu",
            inputPlaceholder: "Tulis pertanyaanmu...",
          },
        },
      });
      // @ts-expect-error - simple global flag
      window.__mlN8nChatInited = true;
      console.log("[ChatWidget] n8n chat initialized successfully.");

      // Terapkan patch gaya inline sebagai fallback jika CSS override tidak menempel
      const applyInlineBranding = () => {
        const root = document.querySelector('#n8n-chat') || document.body;
        const header = root?.querySelector(
          '[class*="chat-header"],[class*="ChatHeader"],[class*="header"], header'
        ) as HTMLElement | null;
        if (header) {
          header.style.backgroundImage = 'linear-gradient(135deg, #6B46C1, #B794F4)';
          const title = header.querySelector('h1,h2,h3,.title') as HTMLElement | null;
          if (title) {
            title.style.fontFamily = 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif';
            title.style.fontWeight = '800';
            title.style.letterSpacing = '0.2px';
            title.style.color = '#FFFFFF';
          }
        }
        const btns = root?.querySelectorAll('[class*="launcher"],[class*="toggle"],[class*="close"]');
        btns?.forEach((el) => {
          const b = el as HTMLElement;
          b.style.backgroundImage = 'linear-gradient(135deg, #6B46C1, #B794F4)';
          b.style.color = '#FFFFFF';
        });
      };

      // Jalankan setelah render widget
      requestAnimationFrame(() => applyInlineBranding());
      setTimeout(applyInlineBranding, 500);
    } catch (error) {
      console.error("[ChatWidget] Failed to initialize n8n chat:", error);
    }
  }, [webhookUrl]);

  return <div id="moodlab-n8n-chat-container" />;
};

export default ChatWidget;
