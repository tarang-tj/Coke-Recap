import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GLSL strings imported via ?raw — keep shaders as plain text files,
// no extra plugin required.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
