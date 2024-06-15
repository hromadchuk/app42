import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        legacy(),
        visualizer({
            filename: 'bundle-visualizer.html'
        })
    ],
    build: {
        target: 'esnext',
        outDir: 'dist',
        minify: 'terser'
    }
});
