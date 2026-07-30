import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        // Change from 'http://backend:8000' to localhost
        target: 'http://127.0.0.1:8000', 
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        // Change from 'http://backend:8000' to localhost
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});