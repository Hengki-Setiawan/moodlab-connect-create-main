import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "@n8n/chat/style.css";
import "@/chat-widget.css";
import { createChat } from "@n8n/chat";

console.log('[ChatWidget] VITE_N8N_CHAT_URL:', import.meta.env.VITE_N8N_CHAT_URL);

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

    // Coba init widget n8n (hindari double init)
    try {
      // @ts-expect-error - flag global sederhana
      if (!window.__mlN8nChatInited) {
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
        // @ts-expect-error - flag global sederhana
        window.__mlN8nChatInited = true;
        console.log("[ChatWidget] Inisialisasi n8n chat berhasil");
      } else {
        console.log("[ChatWidget] Lewati init: sudah diinisialisasi");
      }
    } catch (e) {
      console.error("[ChatWidget] Gagal init n8n chat:", e);
      return; // Jaga fallback tetap tampil jika error
    }

    // Deteksi kemunculan konten n8n secara lebih robust
    const container = document.getElementById("n8n-chat");
    if (container) {
      // 1) Observer: jika ada child, sembunyikan fallback
      const observer = new MutationObserver(() => {
        if (container.childElementCount > 0) {
          console.log("[ChatWidget] Konten n8n masuk ke #n8n-chat, sembunyikan fallback");
          setShowFallback(false);
          observer.disconnect();
        }
      });
      observer.observe(container, { childList: true, subtree: true });

      // 2) Timeout backup: cek beberapa pola umum
      const timer = setTimeout(() => {
        const hasChild = container.childElementCount > 0;
        const hasLauncherByClass = document.querySelector('#n8n-chat [class*="launcher"]');
        const hasIframe = container.querySelector("iframe");
        if (hasChild || hasLauncherByClass || hasIframe) {
          console.log("[ChatWidget] Deteksi backup sukses (child/launcher/iframe), sembunyikan fallback");
          setShowFallback(false);
          observer.disconnect();
        } else {
          console.warn("[ChatWidget] Belum ada tanda widget, fallback tetap ditampilkan");
        }
      }, 1800);

      return () => {
        observer.disconnect();
        clearTimeout(timer);
      };
    }
    return;
  }, [webhookUrl]);

  return (
    <>
      <div id="n8n-chat" style={{ position: "relative", zIndex: 2147483647 }} />
      {showFallback &&
        createPortal(
          <div
            className="ml-offline-wrapper"
            data-test-id="ml-offline-wrapper"
            style={{ position: "fixed", right: 24, bottom: 24, zIndex: 2147483646 }}
          >
            <button
              className="ml-offline-launcher"
              aria-label="Moodlab Chat (offline)"
              onClick={() => setFallbackOpen((v) => !v)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 9999,
                background: "linear-gradient(135deg, #4db7ff, #9d5cff, #ff5bb7)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                border: "none",
                cursor: "pointer",
              }}
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
