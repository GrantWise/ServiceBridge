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
  build: {
    // Optimize bundle size
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunking strategy for better caching
        manualChunks: {
          // React and core dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI component libraries
          'ui-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          
          // Data fetching and state management
          'query-vendor': [
            '@tanstack/react-query',
            '@tanstack/react-query-devtools',
            '@tanstack/react-table',
            'axios',
          ],
          
          // Animation and charts
          'visual-vendor': [
            'framer-motion',
            'recharts',
          ],
          
          // Utilities
          'utils-vendor': [
            'date-fns',
            'zod',
            'dompurify',
            'isomorphic-dompurify',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
          
          // SignalR and communication
          'signalr-vendor': [
            '@microsoft/signalr',
          ],
          
          // Virtual scrolling
          'virtual-vendor': [
            'react-window',
            'react-window-infinite-loader',
          ],
          
          // Forms and validation
          'forms-vendor': [
            'react-hook-form',
            '@hookform/resolvers',
          ],
        },
      },
    },
    
    // Enable source maps for production debugging
    sourcemap: true,
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    
    // Target modern browsers for better tree shaking
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
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
