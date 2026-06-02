import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Source HTML lives in src/ so it never conflicts with the built output at root
  root: 'src',
  publicDir: '../public',
  build: {
    // Build compiled output to project root so CF Pages (output dir: '.') serves it directly
    outDir: '..',
    emptyOutDir: false,
  },
  server: {
    port: 4173
  }
});
