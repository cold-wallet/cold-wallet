import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Whether to polyfill `node:` protocol imports in all files, or only in files that explicitly import from 'node:*'
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['ccxt', 'protobufjs', '@protobufjs/inquire', 'vm-browserify'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      // NOTE: ccxt / protobufjs must NOT be externalized for a browser build — there is
      // no importmap or CDN to resolve bare specifiers at runtime, so externalizing them
      // makes the entry chunk throw "Failed to resolve module specifier 'ccxt'" before
      // React mounts (blank page). They are bundled instead.
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          wagmi: ['wagmi', 'viem', '@wagmi/core'],
          charts: ['highcharts', 'highcharts-react-official'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
});
