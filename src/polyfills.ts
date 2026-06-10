// Polyfills for Node.js built-ins in browser
import { Buffer } from 'buffer';
import process from 'process';

// Make available globally
(window as any).Buffer = Buffer;
(window as any).process = process;
(window as any).global = window;

// Export for TypeScript
export {};
