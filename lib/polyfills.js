// Polyfills for server-side rendering
// This must be executed before any other code that might reference 'self'

// Immediately define self if we're in Node.js environment
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  // Define self as global for server-side compatibility
  global.self = global;
  
  // Also define it on globalThis for modern Node.js versions
  if (typeof globalThis !== 'undefined') {
    globalThis.self = globalThis;
  }
  
  // Define window as global for libraries that expect it
  global.window = global;
  
  // Define document as a minimal mock
  global.document = {
    createElement: () => ({}),
    getElementById: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  
  // Don't override navigator - it's a read-only property in Node.js
  // Just ensure it exists with a userAgent property if needed
  if (!global.navigator) {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Node.js',
      },
      writable: false,
      configurable: false,
    });
  }
}

// Export empty object to make this a valid module
export {};