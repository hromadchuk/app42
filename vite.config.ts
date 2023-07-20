import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        nodePolyfills({
            // Whether to polyfill specific globals.
            globals: {
                Buffer: true,
                global: true,
                process: true
            },
            // Whether to polyfill `node:` protocol imports.
            protocolImports: true
        }),
        splitVendorChunkPlugin(),
        visualizer({
            filename: 'bundle-visualizer.html'
        })
    ]
});
