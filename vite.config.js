import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdf-lib']
        }
      }
    }
  },
  server: {
    port: 5174,
    open: true
  }
});
