import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function expressPlugin(): Plugin {
  return {
    name: 'express-trpc-backend',
    async configureServer(server) {
      const { default: app } = await import('./server/_core/app');
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          return (app as any)(req, res, next);
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [expressPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        '@shared': path.resolve(import.meta.dirname, './shared'),
        '@server': path.resolve(import.meta.dirname, './server'),
      },
    },
    build: {
      outDir: 'dist/public',
      emptyOutDir: true,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
