import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so the same dist works on GitHub Pages (/clearwarden/) and inside the Capacitor APK.
  base: './',
  define: { 'process.env': {} },
  // Several dev servers can run side by side (design, capture, review); each gets its own dep cache.
  cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
  build: { chunkSizeWarningLimit: 900 },
})
