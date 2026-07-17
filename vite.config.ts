import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),

    // 🎨 UnoCSS + Phosphor Icons
    UnoCSS(),

    // ⚡️ 自动导入 Vue API / Router / Pinia
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),

    // 🧩 自动注册组件
    Components({
      dts: 'src/components.d.ts',
    }),

    // 📱 PWA 核心配置 (适配 iOS 26)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],

      manifest: {
        name: 'Reset',
        short_name: '正是修行时',
        description: '本地优先的个人恢复与事件流记录系统',
        theme_color: '#34C759',       // Reset Green
        background_color: '#F2F2F7',  // iOS Light Gray
        display: 'standalone',        // 🔑 隐藏 Safari 地址栏

        // 🔑 iOS 26 推送 Deep Link 所需的唯一标识
        id: '/reset-app/',
        start_url: '/',

        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // 🔑 适配 Android 自适应图标
          }
        ]
      },

      workbox: {
        navigateFallback: '/index.html',
        // ✅ Precache: 自动注入所有构建产物
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 字体缓存策略示例
        runtimeCaching: [
          {
            // Google Fonts 等外部字体
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API 数据请求 → NetworkFirst + 离线回退
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 用户头像 / 附件图片 → StaleWhileRevalidate
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ]
      },
    })
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // 按第三方库拆包，提升缓存命中率
          if (/[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/.test(id)) return 'vendor-vue'
          if (/[\\/]node_modules[\\/](@vueuse[\\/]core|@vueuse[\\/]rxjs)[\\/]/.test(id)) return 'vendor-utils'
        },
      },
    },
  },
})