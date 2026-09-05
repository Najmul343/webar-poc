import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    basicSsl()
  ],
  server: {
    host: true, // Listen on all network interfaces (LAN IP) for mobile testing
    port: 5173,
    https: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  },
  preview: {
    host: true,
    port: 4173,
    https: true
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500
  }
})
