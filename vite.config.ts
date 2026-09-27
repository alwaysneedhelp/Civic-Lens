import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite already exposes any `.env` variable prefixed with VITE_ (here
// VITE_GEMINI_API_KEY, read in services/geminiService.ts) via
// `import.meta.env` with no extra wiring, so no custom `define` is needed.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
