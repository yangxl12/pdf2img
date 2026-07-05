import legacy from "@vitejs/plugin-legacy";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    legacy({
      targets: ["Android >= 7", "iOS >= 12", "last 2 Chrome versions", "last 2 Safari versions"],
      modernPolyfills: true
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pdfjs/**/*", "icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "票影工坊",
        short_name: "票影",
        description: "本地离线 PDF 转 PNG 工具",
        lang: "zh-CN",
        start_url: ".",
        display: "standalone",
        background_color: "#f7f3ea",
        theme_color: "#f7f3ea",
        icons: [
          { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
          { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
          { "src": "icon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,wasm,bcmap,pfb,otf,ttf}"],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: "index.html"
      }
    })
  ],
  base: "/pdf2img/",
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  },
  preview: {
    host: "0.0.0.0",
    port: 4173
  }
});
