import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: (id) => {
        if (id === 'buffer' || id.startsWith('buffer/')) {
          return false;
        }
        return false;
      },
    },
  },
  optimizeDeps: {
    include: ['buffer'],
    exclude: [],
  },
});