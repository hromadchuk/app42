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
            workbox: {
                globPatterns: ['**/*.{svg,png,gif}']
            },
            manifest: {
                // theme_color: '#449aea',
                display: 'standalone',
                scope: '/',
                start_url: '/kit-42/',
                short_name: 'Kit 42',
                description: 'Kit 42 is a product with features for Telegram',
                name: 'Kit 42',
                icons: [
                    {
                        src: './icons/48x48.png',
                        sizes: '48x48',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: './icons/72x72.png',
                        sizes: '72x72',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: './icons/96x96.png',
                        sizes: '96x96',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: './icons/128x128.png',
                        sizes: '128x128',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: './icons/144x144.png',
                        sizes: '144x144',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: './icons/152x152.png',
                        sizes: '152x152',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: './icons/192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: './icons/384x384.png',
                        sizes: '384x384',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: './icons/512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable any'
                    }
                ]
            }
        }),
        visualizer({
            filename: 'bundle-visualizer.html'
        })
    ]
});
