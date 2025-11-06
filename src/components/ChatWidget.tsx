import { useEffect, useState } from "react";
import "@n8n/chat/style.css";
import "@/chat-widget.css";
import { createChat } from "@n8n/chat";

export default function ChatWidget() {
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const webhookUrl = import.meta.env.VITE_N8N_CHAT_URL as string | undefined;

  useEffect(() => {
    if (!webhookUrl) {
      console.warn("[ChatWidget] Missing VITE_N8N_CHAT_URL env var");
      return;
    }

    try {
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
    } catch (e) {
      console.error("[ChatWidget] Gagal init n8n chat:", e);
    }
  }, [webhookUrl]);

  return (
    <>
      <div id="n8n-chat" />
      {!webhookUrl && (
        <div className="ml-offline-wrapper">
          <button
            className="ml-offline-launcher"
            aria-label="Moodlab Chat (offline)"
            onClick={() => setFallbackOpen((v) => !v)}
          />
          {fallbackOpen && (
            <div className="ml-offline-tooltip">
              <div className="ml-offline-title">Moodlab Assistant</div>
              <div className="ml-offline-desc">
                Chat belum aktif. Tambahkan `VITE_N8N_CHAT_URL` di Vercel dan
                masukkan domain situs ke Allowed origins n8n.
              </div>
              <a href="/kontak" className="ml-offline-action">Hubungi Kami</a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
