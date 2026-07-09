import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api/* is proxied to the backend, so the UI code never hardcodes a host.
// In Docker Compose the target is http://backend:4000 (see VITE_API_PROXY).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
