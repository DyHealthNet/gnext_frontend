import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

console.log('>>> Using vite.config.js <<<');


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  console.log('Loaded env variables:', env) // <-- check here


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
    plugins: [vue(), vueDevTools()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
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
