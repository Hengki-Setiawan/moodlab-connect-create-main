import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


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
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
