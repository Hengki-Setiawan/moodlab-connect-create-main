
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
    } catch (error) {
      console.error("[ChatWidget] Failed to initialize n8n chat:", error);
    }
  }, [webhookUrl]);

  return <div id="moodlab-n8n-chat-container" />;
};

export default ChatWidget;
