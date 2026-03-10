
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'ui': ['lucide-react', 'clsx', 'tailwind-merge']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:' + (process.env.PORT || 3000),
        changeOrigin: true,
      }
    }
  }
});
