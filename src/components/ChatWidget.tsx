
import { useEffect } from "react";
import "@n8n/chat/style.css";
import "@/chat-widget.css";
import { createChat } from "@n8n/chat";

 const ChatWidget = () => {
   // Saat development, gunakan proxy lokal untuk menghindari CORS
   const isDev = import.meta.env.DEV;
   const apiKey = import.meta.env.VITE_N8N_API_KEY as string | undefined;
   const rawUrl = isDev ? "/n8n-chat" : (import.meta.env.VITE_N8N_CHAT_URL as string | undefined);
   const forceEmbedded = (() => {
     const val = import.meta.env.VITE_N8N_FORCE_EMBEDDED as string | undefined;
     if (val === undefined || val === null || val === "") {
       // Default: TIDAK memaksa Embedded; hormati Hosted agar tidak perlu ubah n8n
       return false;
     }
     const s = String(val).toLowerCase();
     return s === "true" || s === "1" || s === "yes";
   })();
  const isHostedUrl = !!rawUrl && /\/chat(\/?|$)/.test(String(rawUrl));
  // Jangan tambahkan '/chat' otomatis. Ikuti apa yang diberikan di env.
  const useHostedChat = !!rawUrl && isHostedUrl && !forceEmbedded;
  const webhookUrl = rawUrl;

  // Tidak ada state UI untuk versi non-floating

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

    // Jika URL mengarah ke halaman Hosted Chat (/chat), kita render via iframe
    if (useHostedChat) {
      console.log("[ChatWidget] Using Hosted Chat iframe; skipping @n8n/chat initialization.");
      // Tandai agar tidak re-init
      // @ts-expect-error - simple global flag
      window.__mlN8nChatInited = true;
      return;
    }

    try {
      createChat({
        webhookUrl,
        webhookConfig: {
          method: "POST",
          headers: apiKey ? { "X-N8N-API-KEY": apiKey } : {},
        },
        target: "#moodlab-n8n-chat-container",
        mode: "window",
        showWelcomeScreen: false,
        loadPreviousSession: false,
        initialMessages: ["Halo saya Mody, AI chat bot dari Moodlab 😊", "Ada yang bisa saya bantu?"],
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
          // Set sumber gambar Mody ke variabel CSS agar pseudo-element ::before bisa menampilkan avatar
          const modyUrl = (import.meta.env.VITE_MODY_HEADER_URL as string | undefined) || '/mody.png';
          header.style.setProperty('--mody-header-image', `url('${modyUrl}')`);
          header.style.backgroundImage = 'linear-gradient(135deg, #6B46C1, #B794F4)';
          header.style.padding = '6px 14px';
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          header.style.justifyContent = 'center';
          header.style.position = 'relative';
          header.style.textAlign = 'center';
          // Animasi muncul halus
          header.style.opacity = '0';
          header.style.transform = 'translateY(-6px)';
          header.style.transition = 'opacity 200ms ease, transform 240ms ease';
          const title = header.querySelector('h1,h2,h3,.title') as HTMLElement | null;
          if (title) {
            title.style.fontFamily = 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif';
            title.style.fontWeight = '800';
            title.style.letterSpacing = '0.3px';
            // Ubah teks header menjadi putih (fallback inline)
            title.style.backgroundImage = '';
            // @ts-ignore
            title.style.webkitBackgroundClip = '';
            // @ts-ignore
            title.style.webkitTextFillColor = '';
            title.style.backgroundClip = '';
            title.style.color = '#FFFFFF';
            title.style.fontSize = '18px';
            title.style.lineHeight = '1.1';
            title.style.position = 'relative';
            title.style.textAlign = 'center';
            // Sedikit shadow untuk keterbacaan
            // @ts-ignore
            title.style.webkitTextStroke = '0';
            title.style.textShadow = '0 1px 2px rgba(0,0,0,0.25)';
            // Hapus ikon fallback jika ada
            const icon = header.querySelector('#ml-header-icon') as HTMLElement | null;
            if (icon) icon.remove();
            // Tambahkan avatar Mody sebagai fallback inline jika gambar tidak muncul via CSS
            const existingMody = header.querySelector('#ml-header-mody') as HTMLImageElement | null;
            if (!existingMody) {
              const modyImg = document.createElement('img');
              modyImg.id = 'ml-header-mody';
              const envUrl = (import.meta.env.VITE_MODY_HEADER_URL as string | undefined) || '/mody.png';
              modyImg.src = envUrl;
              modyImg.alt = 'Mody';
              Object.assign(modyImg.style, {
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                zIndex: '2',
              } as CSSStyleDeclaration);
              modyImg.onerror = () => { modyImg.style.display = 'none'; };
              header.appendChild(modyImg);
            }
          }
          // Sembunyikan subtitle (fallback inline)
          const subtitle = header.querySelector('.subtitle, [class*="subtitle"], p') as HTMLElement | null;
          if (subtitle) {
            subtitle.style.display = 'none';
          }
          // Tambahkan ikon robot svg di header (kanan)
          let robot = header.querySelector('#ml-header-robot') as HTMLElement | null;
          if (!robot) {
            robot = document.createElement('span');
            robot.id = 'ml-header-robot';
            robot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2 2 0 012 2v1h3a2 2 0 012 2v8a3 3 0 01-3 3H8a3 3 0 01-3-3V7a2 2 0 012-2h3V4a2 2 0 012-2h2zm-5 7a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2zM9 15h6a3 3 0 00-6 0z"/></svg>';
            Object.assign(robot.style, {
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: '3',
            } as CSSStyleDeclaration);
            header.appendChild(robot);
          }
          // Trigger animasi setelah gaya terpasang
          requestAnimationFrame(() => {
            header!.style.opacity = '1';
            header!.style.transform = 'translateY(0)';
          });
        }
        const btns = root?.querySelectorAll('[class*="launcher"],[class*="toggle"],[class*="close"]');
        btns?.forEach((el) => {
          const b = el as HTMLElement;
          b.style.backgroundImage = 'linear-gradient(135deg, #6B46C1, #B794F4)';
          b.style.color = '#FFFFFF';
        });
      };

      // Quick Reply Chips di bawah area pesan untuk opsi klik cepat
      const mountQuickReplies = (options: { label: string; value: string }[]) => {
        const root = document.querySelector('#n8n-chat') || document.body;
        if (!root || document.getElementById('ml-quick-replies')) return;
        const inputEl = root.querySelector('input[placeholder], textarea[placeholder]') as HTMLInputElement | HTMLTextAreaElement | null;
        let inputWrap = inputEl?.closest('[class*="footer"],[class*="composer"],[class*="Input"],[class*="input"], form') as HTMLElement | null;
        const host = (inputWrap?.parentElement as HTMLElement | null)
          || (root.querySelector('[class*="chat-window"],[class*="window"]') as HTMLElement | null)
          || root;
        if (host && getComputedStyle(host).position === 'static') {
          host.style.position = 'relative';
        }
        const container = document.createElement('div');
        container.id = 'ml-quick-replies';
        options.forEach((opt) => {
          const btn = document.createElement('button');
          btn.className = 'ml-chip';
          btn.type = 'button';
          btn.textContent = opt.label;
          btn.addEventListener('click', () => {
            const input = root.querySelector('input[placeholder], textarea[placeholder]') as HTMLInputElement | HTMLTextAreaElement | null;
            if (!input) return;
            (input as any).value = opt.value;
            input.dispatchEvent(new InputEvent('input', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
          });
          container.appendChild(btn);
        });
        if (inputWrap && inputWrap.parentElement) {
          inputWrap.parentElement.insertBefore(container, inputWrap);
        } else if (host) {
          host.appendChild(container);
        }
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

      // Helper: render bubble error ramah dalam jendela chat
      const renderErrorBubble = (text: string) => {
        const root = document.querySelector('#n8n-chat') || document.body;
        const host = (root?.querySelector('[class*="messages"], [class*="Messages"], [class*="body"], [class*="content"], [class*="list"]') as HTMLElement | null) || (root as HTMLElement | null) || document.body;
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble message-in ml-error-bubble';
        bubble.textContent = text;
        host?.appendChild(bubble);
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
        if (!useHostedChat && urlStr && urlStr.includes(chatPathname)) {
          // Tampilkan indikator segera ketika request dikirim
          typing.show();
          try {
            const res = await originalFetch(input as any, init as any);
            // Deteksi error umum dan tampilkan petunjuk
            if (res && !res.ok) {
              console.warn('[ChatWidget] Webhook error:', res.status, res.statusText);
              if (res.status === 401 || res.status === 403) {
                renderErrorBubble('Autentikasi gagal (' + res.status + '). Jika API key error, isi VITE_N8N_API_KEY di .env lalu restart.');
              } else if (res.status === 404) {
                renderErrorBubble('Webhook tidak ditemukan (404). Pastikan workflow n8n aktif dan URL benar.');
              } else if (res.status === 422) {
                renderErrorBubble('Format body tidak sesuai (422). Sesuaikan node Chat agar menerima format dari @n8n/chat.');
              } else if (res.status >= 500) {
                renderErrorBubble('Maaf, server n8n error (' + res.status + '). Coba lagi nanti atau cek log workflow.');
              }
            }
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
            // Sembunyikan quick replies setelah user mengirim pesan pertama
            if (/message-bubble/.test(cls) && /message-out/.test(cls)) {
              const qr = document.getElementById('ml-quick-replies');
              if (qr) qr.remove();
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
      requestAnimationFrame(() => {
        applyInlineBranding();
        mountQuickReplies([
          { label: 'Info Harga', value: 'Tanyakan info harga layanan' },
          { label: 'Cara Pesan', value: 'Bagaimana cara memesan layanan?' },
          { label: 'Lokasi Layanan', value: 'Di mana lokasi layanan tersedia?' },
          { label: 'Hubungi CS', value: 'Saya ingin menghubungi customer service' },
        ]);
      });
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

  // UI sebelumnya: tampilkan iframe Hosted jika URL berakhiran /chat
  if (useHostedChat) {
    const src = webhookUrl;
    return (
      <div id="moodlab-n8n-chat-container">
        <iframe
          id="n8n-hosted-chat-iframe"
          title="Moodlab Assistant"
          src={src}
          style={{
            width: '100%',
            height: '520px',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)'
          }}
        />
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: '#6B46C1', fontWeight: 600 }}>
            Jika iframe tidak tampil, buka chat di tab baru
          </a>
        </div>
      </div>
    );
  }

  // Jika bukan /chat, gunakan embedded via @n8n/chat
  return <div id="moodlab-n8n-chat-container" />;
};

export default ChatWidget;
