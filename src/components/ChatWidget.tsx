import { useEffect } from "react";
import "@n8n/chat/style.css";
import "@/chat-widget.css";
import { createChat } from "@n8n/chat";

export default function ChatWidget() {
  useEffect(() => {
    const webhookUrl = import.meta.env.VITE_N8N_CHAT_URL as string | undefined;
    if (!webhookUrl) {
      console.warn("[ChatWidget] Missing VITE_N8N_CHAT_URL env var");
      return;
    }

    createChat({
      webhookUrl,
      target: "#n8n-chat",
      mode: "window",
      showWelcomeScreen: false,
      chatInputKey: "chatInput",
      chatSessionKey: "sessionId",
      loadPreviousSession: true,
      enableStreaming: false,
      initialMessages: ["Halo! 👋", "Ada yang bisa saya bantu?"],
      i18n: {
        en: {
          title: "Moodlab Assistant",
          subtitle: "Kami siap membantu pertanyaanmu",
          footer: "",
          getStarted: "Mulai Percakapan",
          inputPlaceholder: "Tulis pertanyaanmu...",
        },
      },
    });
  }, []);

  return <div id="n8n-chat" />;
}
