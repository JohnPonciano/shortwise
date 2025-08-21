import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return ({
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api/abacatepay': {
          target: 'https://api.abacatepay.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/abacatepay/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Adicionar headers necessários
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_ABACATEPAY_API_KEY || ''}`);
            });
          }
        }
      }
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  })
});
