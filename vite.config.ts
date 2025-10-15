import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
    plugins: [react(), tailwindcss()],
    server: mode === "development"
        ? {
            host: 'localhost', // Permite acceso desde subdominios
            port: 5173,
            proxy: {
                "/api": {
                    // Para desarrollo local con backend Django local:
                    target: "http://localhost:8000",
                    // Para desarrollo con backend remoto, usar:
                    // target: "https://notificct.dpdns.org",
                    changeOrigin: true,
                    secure: false,
                    // Preservar headers del host original para detección de subdominio
                    configure: (proxy, _options) => {
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            // Mantener el host original en los headers
                            if (req.headers.host) {
                                proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
                            }
                        });
                    },
                },
            },
        }
        : undefined,
}));
