import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const buildDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const appEnv = process.env.VITE_APP_ENV || 'production'
const isTest = appEnv === 'test'

function envHtmlPlugin(): Plugin {
  return {
    name: 'env-html',
    transformIndexHtml(html) {
      if (!isTest) return html
      return html
        .replace('/icon.svg', '/icon-test.svg')
        .replace('/manifest.json', '/manifest-test.json')
        .replace('/apple-touch-icon.png', '/apple-touch-icon-test.png')
        .replace(/<title>.*?<\/title>/, '<title>JiCompta (TEST)</title>')
        .replace(/content="#3b82f6"/g, 'content="#6b7280"')
        .replace(/content="#1e40af"/, 'content="#374151"')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), envHtmlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __APP_ENV__: JSON.stringify(appEnv),
  },
})
