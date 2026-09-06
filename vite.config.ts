import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-is',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'use-sync-external-store',
        'use-sync-external-store/shim',
        'use-sync-external-store/with-selector',
        'recharts',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
      ],
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react-is', 'use-sync-external-store'],
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react-is': path.resolve(__dirname, 'node_modules/react-is'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
