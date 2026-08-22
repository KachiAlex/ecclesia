// Global polyfills that must be loaded before any other code
// This file should be imported at the very beginning of the application

// Check if we're in a server environment
if (typeof window === 'undefined') {
  // Define self as global
  if (typeof global !== 'undefined') {
    global.self = global;
  }
  
  // Define self on globalThis as well
  if (typeof globalThis !== 'undefined') {
    globalThis.self = globalThis;
  }
}