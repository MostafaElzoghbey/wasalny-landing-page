import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: {
        disabled: false,
        config: true,
      },
      manifest: {
        name: 'وصلني - خدمة نقل الركاب',
        short_name: 'وصلني',
        description: 'خدمة نقل الركاب الأولى في دمياط. رحلات مريحة وآمنة إلى القاهرة والمطار.',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/assets/images/logo/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: '/assets/images/logo/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/images/logo/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/assets/images/logo/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
