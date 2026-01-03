// Polyfills for server-side rendering
// This must be executed before any other code that might reference 'self'

// Immediately define self if we're in Node.js environment
(function() {
  // Check if we're in a Node.js environment (server-side)
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // Define self as global for server-side compatibility
    if (typeof global.self === 'undefined') {
      global.self = global;
    }
    
    // Also define it on globalThis for modern Node.js versions
    if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
      globalThis.self = globalThis;
    }
    
    // Define window as global for libraries that expect it
    if (typeof global.window === 'undefined') {
      global.window = global;
    }
    
    // Define document as a minimal mock
    if (typeof global.document === 'undefined') {
      global.document = {
        createElement: () => ({}),
        getElementById: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
      };
    }
    
    // Define navigator as a minimal mock
    if (typeof global.navigator === 'undefined') {
      global.navigator = {
        userAgent: 'Node.js',
      };
    }
  }
})();

// Export empty object to make this a valid module
export {};