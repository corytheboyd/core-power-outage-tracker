import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // https://vitejs.dev/config/

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "public",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",

      includeAssets: ["addresses.parquet"],

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "vite-project",
        short_name: "vite-project",
        description: "vite-project",
        theme_color: "#ffffff",
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/([a-c])\.tile\.openstreetmap\.org\/.*/i,
            // TODO: CacheFirst
            handler: "NetworkOnly",
            options: {
              cacheName: "openstreetmap-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
});
