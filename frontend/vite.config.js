import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// The original project used Create React App, so most source files carry a `.js`
// extension while containing JSX. Vite/esbuild only treats `.jsx` as JSX by default,
// so we widen the loader to cover `.js` files under `src/`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 3000, open: true },
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: {
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
});
