/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global type declarations for polyfills
declare global {
  interface Window {
    Buffer: typeof import('buffer').Buffer;
    process: typeof import('process/browser');
    global: typeof globalThis;
  }
  
  const Buffer: typeof import('buffer').Buffer;
  const process: typeof import('process/browser');
  const global: typeof globalThis;
}
