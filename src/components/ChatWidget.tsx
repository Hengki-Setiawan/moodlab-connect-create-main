import { useEffect, useState } from "react";
import "@n8n/chat/style.css";
import "@/chat-widget.css";
import { createChat } from "@n8n/chat";

export default function ChatWidget() {
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const webhookUrl = import.meta.env.VITE_N8N_CHAT_URL as string | undefined;

  useEffect(() => {
    // Jika env tidak ada, langsung tampilkan fallback offline
    if (!webhookUrl) {
      console.warn("[ChatWidget] Missing VITE_N8N_CHAT_URL env var");
      setShowFallback(true);
      return;
    }

    // Coba init widget n8n
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

    // Setelah 1.8s, jika launcher belum muncul, tampilkan fallback
    const timer = setTimeout(() => {
      const hasLauncher = document.querySelector('#n8n-chat [class*="launcher"]');
      if (!hasLauncher) {
        console.warn("[ChatWidget] Launcher tidak terbuat, tampilkan fallback offline");
        setShowFallback(true);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [webhookUrl]);

  return (
    <>
      <div id="n8n-chat" />
      {showFallback && (
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
                Chat belum aktif atau gagal inisialisasi. Pastikan `VITE_N8N_CHAT_URL` di Vercel,
                domain situs ada di Allowed origins n8n, dan endpoint n8n memakai HTTPS.
              </div>
              <a href="/kontak" className="ml-offline-action">Hubungi Kami</a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
