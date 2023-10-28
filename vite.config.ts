import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import svgr from 'vite-plugin-svgr';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        // svgr(),
        visualizer({
            filename: 'bundle-visualizer.html'
        })
    ]
});
