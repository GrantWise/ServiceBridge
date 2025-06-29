import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/api': {
        target: 'https://localhost:7001',
        changeOrigin: true,
        secure: false, // For self-signed certificates in development
      },
      '/inventoryhub': {
        target: 'https://localhost:7001',
        ws: true,
        changeOrigin: true,
        secure: false, // For self-signed certificates in development
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
