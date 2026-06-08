import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GLSL strings imported via ?raw — keep shaders as plain text files,
// no extra plugin required.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    // The `three` chunk is ~850 KB by nature (vendor engine code, long-cached);
    // raise the warning bar above it so intentional vendor splits stay quiet.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split heavy, stable vendor code into long-cached chunks so app-code
        // edits don't bust the (large) three.js / R3F download on repeat visits.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/three/') || id.includes('/three-stdlib/')) return 'three';
          if (
            id.includes('@react-three') ||
            id.includes('/postprocessing/') ||
            id.includes('/maath/')
          )
            return 'r3f';
          if (id.includes('/react') || id.includes('/scheduler/')) return 'react';
        },
      },
    },
  },
});
