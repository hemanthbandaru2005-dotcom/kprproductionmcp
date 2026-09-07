import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { driveApiPlugin } from './server/driveApiPlugin.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    driveApiPlugin(),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdfjs-dist')) {
              return 'vendor-pdf';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
          }
        }
      }
    }
  },
  server: {
    allowedHosts: true, // Allows all public tunnel hosts (trycloudflare, localtunnel, etc.)
    host: true,
    port: 5174
  }
});
