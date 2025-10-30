import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const backendOrigin = env.VITE_API_URL || 'http://localhost:8000'

  const tsProto = 'http'
  const tsHost  = env.VITE_TYPESENSE_HOST || 'localhost'
  const tsPort  = env.VITE_TYPESENSE_PORT || '8108'
  const typesenseOrigin = `${tsProto}://${tsHost}:${tsPort}`

  const typesenseKey = env.VITE_TYPESENSE_KEY || ''

  return {
    define: {
      'process.env': env
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'drugst-one'
          }
        }
      }),
      vueDevTools()
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // prevent bundling of the external web component <drugst-one>
    build: {
      rollupOptions: {
        external: ['drugst-one'],
        output: {
          globals: {
            'drugst-one': 'ELEMENT',
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/backend': { target: backendOrigin, changeOrigin: true },
        '/typesense': {
          target: typesenseOrigin,
          changeOrigin: true,
          // browser calls /typesense/... -> proxy sends to /...
          rewrite: p => p.replace(/^\/typesense/, ''),
          configure: proxy => {
            proxy.on('proxyReq', req => {
              if (typesenseKey) req.setHeader('X-TYPESENSE-API-KEY', typesenseKey)
            })
          },
        },
      },
    },
  }
})
