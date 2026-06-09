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
        // raise the warning bar above it so the intentional vendor split stays quiet.
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                // Split ONLY three.js (the ~850 KB engine) into its own long-cached
                // chunk. three has no React dependency, so isolating it is safe.
                //
                // Do NOT also split react / react-dom / @react-three into separate
                // chunks: that reorders module init across chunks and React ends up
                // `undefined` at first use ("Cannot read properties of undefined
                // (reading 'useState')"), crashing the whole app in the production
                // build (dev is unaffected — it doesn't apply manualChunks). Keeping
                // the React ecosystem in the default entry chunk preserves Rollup's
                // correct dependency ordering.
                manualChunks(id) {
                    if (id.includes('node_modules/three/') || id.includes('node_modules/three-stdlib/')) {
                        return 'three';
                    }
                },
            },
        },
    },
});
