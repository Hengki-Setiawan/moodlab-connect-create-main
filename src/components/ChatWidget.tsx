
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
            subtitle: "",
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
          header.style.padding = '6px 14px';
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          header.style.justifyContent = 'center';
          header.style.position = 'relative';
          header.style.textAlign = 'center';
          const title = header.querySelector('h1,h2,h3,.title') as HTMLElement | null;
          if (title) {
            title.style.fontFamily = 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif';
            title.style.fontWeight = '800';
            title.style.letterSpacing = '0.3px';
            // Terapkan gaya gradient seperti logo website
            title.style.backgroundImage = 'linear-gradient(135deg, hsl(var(--gradient-start)), hsl(var(--gradient-mid)), hsl(var(--gradient-end)))';
            // @ts-ignore - vendor prefixed properties
            title.style.webkitBackgroundClip = 'text';
            // @ts-ignore
            title.style.webkitTextFillColor = 'transparent';
            title.style.backgroundClip = 'text';
            title.style.color = 'transparent';
            title.style.fontSize = '18px';
            title.style.lineHeight = '1.1';
            title.style.position = 'relative';
            title.style.textAlign = 'center';
            // Perkuat keterbacaan: stroke + shadow
            // @ts-ignore
            title.style.webkitTextStroke = '0.6px rgba(20,20,20,0.35)';
            title.style.textShadow = '0 2px 6px rgba(0,0,0,0.35)';
            // Hapus ikon fallback jika ada
            const icon = header.querySelector('#ml-header-icon') as HTMLElement | null;
            if (icon) icon.remove();
          }
          // Sembunyikan subtitle jika ada
          const subtitle = header.querySelector('.subtitle, [class*="subtitle"], p') as HTMLElement | null;
          if (subtitle) {
            subtitle.style.display = 'none';
          }
        }
        const btns = root?.querySelectorAll('[class*="launcher"],[class*="toggle"],[class*="close"]');
        btns?.forEach((el) => {
          const b = el as HTMLElement;
          b.style.backgroundImage = 'linear-gradient(135deg, #6B46C1, #B794F4)';
          b.style.color = '#FFFFFF';
        });
      };

      // Pasang typing indicator agar muncul SEBELUM balasan bot
      const typing = {
        el: null as HTMLElement | null,
        active: false,
        _init() {
          if (this.el) return;
          const container = document.querySelector('#n8n-chat') || document.body;
          const bubble = document.createElement('div');
          bubble.id = 'ml-typing-indicator';
          bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
          bubble.style.display = 'none'; // Awalnya disembunyikan
          container.appendChild(bubble);
          this.el = bubble;
        },
        show() {
          this._init();
          if (this.el) {
            this.el.style.display = 'block';
            this.active = true;
          }
        },
        hide() {
          if (this.el) {
            this.el.style.display = 'none';
          }
          this.active = false;
        },
        destroy() {
          this.hide();
          if (this.el) {
            this.el.remove();
            this.el = null;
          }
        },
      };

      // Intercept fetch ke webhook n8n untuk menampilkan typing lebih dini
      const originalFetch = window.fetch.bind(window);
      const chatPathname = (() => {
        try { return new URL(webhookUrl!, window.location.origin).pathname; } catch { return webhookUrl!; }
      })();
      // @ts-expect-error - override fetch untuk keperluan UI
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = (() => {
          if (typeof input === 'string') return input;
          if (input instanceof URL) return input.toString();
          try { return (input as Request).url; } catch { return ''; }
        })();
        if (urlStr && urlStr.includes(chatPathname)) {
          // Tampilkan indikator segera ketika request dikirim
          typing.show();
          try {
            const res = await originalFetch(input as any, init as any);
            // Jangan langsung hide; biarkan MutationObserver yang mendeteksi balasan.
            // Tambahkan fallback hide agar tidak menggantung jika DOM tidak memicu observer.
            setTimeout(() => { if (typing.active) typing.hide(); }, 5000);
            return res;
          } catch (err) {
            typing.hide();
            throw err;
          }
        }
        return originalFetch(input as any, init as any);
      };

      const root = document.querySelector('#n8n-chat') || document.body;
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            const cls = node.className?.toString?.() || '';
            // HANYA cek balasan masuk (message-in) untuk menyembunyikan typing
            if (/message-bubble/.test(cls) && /message-in/.test(cls)) {
              typing.hide();
            }
          });
        }
      });
      if (root) {
        observer.observe(root, { childList: true, subtree: true });
      }

      // Safety timeout: sembunyikan jika tidak ada balasan lama
      const timeoutId = setInterval(() => {
        typing.hide();
      }, 30000);

      // Jalankan setelah render widget
      requestAnimationFrame(() => applyInlineBranding());
      setTimeout(applyInlineBranding, 500);
      // Cleanup
      window.addEventListener('beforeunload', () => {
        typing.destroy();
        observer.disconnect();
        clearInterval(timeoutId);
        // Pulihkan fetch asli
        // @ts-expect-error - restore fetch
        window.fetch = originalFetch;
      });
    } catch (error) {
      console.error("[ChatWidget] Failed to initialize n8n chat:", error);
    }
  }, [webhookUrl]);

  return <div id="moodlab-n8n-chat-container" />;
};

export default ChatWidget;
