import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

    console.log("[ChatWidget] Mulai inisialisasi dengan webhookUrl:", webhookUrl);

    // Selalu tampilkan fallback dulu
    setShowFallback(true);
    console.log("[ChatWidget] Fallback ditampilkan awal");

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
      console.log("[ChatWidget] Inisialisasi n8n chat berhasil");
    } catch (e) {
      console.error("[ChatWidget] Gagal init n8n chat:", e);
      return; // Jaga fallback tetap tampil jika error
    }

    // Setelah init, cek dalam 1.8s apakah launcher muncul; jika ya, sembunyikan fallback
    const timer = setTimeout(() => {
      const hasLauncher = document.querySelector('#n8n-chat [class*="launcher"]');
      if (hasLauncher) {
        console.log("[ChatWidget] Launcher n8n terdeteksi, sembunyikan fallback");
        setShowFallback(false);
      } else {
        console.warn("[ChatWidget] Launcher tidak terdeteksi setelah init, jaga fallback tetap tampil");
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [webhookUrl]);

  return (
    <>
      <div id="n8n-chat" />
      {showFallback &&
        createPortal(
          <div className="ml-offline-wrapper" data-test-id="ml-offline-wrapper">
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
          </div>,
          document.body
        )}
    </>
  );
}
