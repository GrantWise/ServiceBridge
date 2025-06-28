import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { SECURITY_HEADERS } from './src/config/security'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      // Apply security headers in development
      // In production, these should be set by the web server
      ...Object.fromEntries(
        Object.entries(SECURITY_HEADERS).filter(([key]) => 
          // Skip HSTS in development
          key !== 'Strict-Transport-Security'
        )
      ),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5196',
        changeOrigin: true,
      },
      '/inventoryhub': {
        target: 'http://localhost:5196',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
