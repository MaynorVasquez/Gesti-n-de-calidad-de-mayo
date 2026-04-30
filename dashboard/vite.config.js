import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import path from 'path'
import fs from 'fs'

const APP = 'may_quality_management'
const SPA = 'dashboard'

function copyIndexHTMLToWWW() {
  return {
    name: 'copy-index-html-to-www',
    closeBundle() {
      const src = path.resolve(__dirname, `../${APP}/public/${SPA}/index.html`)
      const dst = path.resolve(__dirname, `../${APP}/www/qc_dashboard.html`)
      if (!fs.existsSync(src)) return
      let html = fs.readFileSync(src, 'utf-8')
      html = html.replace(
        '<head>',
        `<head>\n    <script>window.csrf_token = "{{ csrf_token }}";</script>`
      )
      fs.mkdirSync(path.dirname(dst), { recursive: true })
      fs.writeFileSync(dst, html)
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    Icons({ compiler: 'vue3' }),
    copyIndexHTMLToWWW(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: `/assets/${APP}/${SPA}/`,
  optimizeDeps: {
    exclude: ['frappe-ui'],
    include: ['feather-icons', 'showdown', 'engine.io-client'],
  },
  build: {
    outDir: `../${APP}/public/${SPA}`,
    emptyOutDir: true,
    target: 'es2019',
    rollupOptions: {
      output: {
        manualChunks: {
          'frappe-ui': ['frappe-ui'],
        },
      },
    },
  },
  server: {
    port: 8080,
    proxy: {
      '^/(app|api|assets|files|private|method|login)': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
    },
  },
})
