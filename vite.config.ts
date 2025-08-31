import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import { splitVendorChunkPlugin } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React Fast Refresh 설정
      fastRefresh: true,
      // Babel 최적화
      babel: {
        plugins: [
          ['@babel/plugin-transform-runtime', { regenerator: true }]
        ],
      },
    }),
    // Vendor chunk splitting
    splitVendorChunkPlugin(),
    // PWA 설정
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon-192x192.png'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    }),
    // Gzip/Brotli 압축
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle 분석 (build 시에만)
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  server: {
    port: 3000,
    // HMR 최적화
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    // ES2020 타겟으로 더 작은 번들 생성
    target: 'es2020',
    // CSS 코드 분할
    cssCodeSplit: true,
    // 번들 최적화 설정
    rollupOptions: {
      output: {
        // 개선된 청크 분할 전략
        manualChunks: (id) => {
          // node_modules 처리
          if (id.includes('node_modules')) {
            // React 관련
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Redux 관련
            if (id.includes('redux') || id.includes('@reduxjs')) {
              return 'redux-vendor';
            }
            // UI 라이브러리
            if (id.includes('framer-motion') || id.includes('@heroicons')) {
              return 'ui-vendor';
            }
            // 차트 라이브러리
            if (id.includes('recharts') || id.includes('d3')) {
              return 'chart-vendor';
            }
            // 유틸리티
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('axios')) {
              return 'utils-vendor';
            }
            // 기타 vendor
            return 'vendor';
          }
        },
        // 청크 파일명 패턴
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/[name]-${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop() || 'asset';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
      // Tree shaking 최적화
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
    // 청크 크기 경고 임계값 설정
    chunkSizeWarningLimit: 1000,
    // 소스맵 생성 (프로덕션에서는 hidden)
    sourcemap: 'hidden',
    // 압축 최적화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    // 레포트 생성
    reportCompressedSize: false,
  },
  // 의존성 사전 번들링 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'react-router-dom',
      'framer-motion',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'recharts',
      'date-fns',
      'i18next',
      'react-i18next',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // 성능 최적화
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    treeShaking: true,
  },
  // 환경 변수 접두사
  envPrefix: 'REACT_APP_',
})