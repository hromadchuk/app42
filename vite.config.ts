import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        VitePWA({
            manifest: {
                theme_color: '#449aea',
                background_color: '#449aea',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                short_name: 'Kit 42',
                description: 'Kit 42 is a product with features for Telegram',
                name: 'Kit 42',
                icons: [
                    {
                        src: './icons/192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: './icons/256x256.png',
                        sizes: '256x256',
                        type: 'image/png'
                    },
                    {
                        src: './icons/384x384.png',
                        sizes: '384x384',
                        type: 'image/png'
                    },
                    {
                        src: './icons/512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        }),
        visualizer({
            filename: 'bundle-visualizer.html'
        })
    ]
});
