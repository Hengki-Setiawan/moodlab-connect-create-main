import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const chatUrl = env.VITE_N8N_CHAT_URL ? new URL(env.VITE_N8N_CHAT_URL) : null;
  const proxyTarget = chatUrl ? `${chatUrl.protocol}//${chatUrl.host}` : undefined;
  const proxyPathname = chatUrl ? chatUrl.pathname : undefined;

  return {
    server: {
      host: "localhost",
      port: 1111,
      proxy: proxyTarget && proxyPathname
        ? {
          "/n8n-chat": {
            target: proxyTarget,
            changeOrigin: true,
            secure: true,
            // Pertahankan suffix path setelah /n8n-chat
            // Misal: /n8n-chat/chat -> /webhook/<id>/chat
            rewrite: (path) => {
              const suffixRaw = path.replace(/^\/n8n-chat/, "");
              const base = proxyPathname || "";
              const baseNorm = base.endsWith("/") ? base.slice(0, -1) : base;
              const suffixNorm = suffixRaw.startsWith("/") ? suffixRaw : `/${suffixRaw}`;
              if (baseNorm.endsWith("/chat") && suffixNorm === "/chat") {
                return baseNorm; // hindari duplikasi /chat
              }
              return `${baseNorm}${suffixNorm}`;
            },
          },
        }
        : undefined,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Moodlab - Agensi Pemasaran Digital',
          short_name: 'Moodlab',
          description: 'Agensi pemasaran digital Gen Z untuk UMKM Indonesia',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
