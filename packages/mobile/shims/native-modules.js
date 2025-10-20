/**
 * Mock Native Modules for Web
 * Prevents React Native from trying to access native bridge on web
 */

// CRITICAL: Ensure setImmediate is polyfilled FIRST
if (typeof setImmediate === 'undefined') {
  const setImmediatePolyfill = function(callback) {
    var args = Array.prototype.slice.call(arguments, 1);
    return setTimeout(function() {
      callback.apply(null, args);
    }, 0);
  };
  
  const clearImmediatePolyfill = function(id) {
    clearTimeout(id);
  };

  if (typeof global !== 'undefined') {
    global.setImmediate = setImmediatePolyfill;
    global.clearImmediate = clearImmediatePolyfill;
  }
  if (typeof window !== 'undefined') {
    window.setImmediate = setImmediatePolyfill;
    window.clearImmediate = clearImmediatePolyfill;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.setImmediate = setImmediatePolyfill;
    globalThis.clearImmediate = clearImmediatePolyfill;
  }
}

// Note: __fbBatchedBridgeConfig is set in index.web.js to avoid Expo detection
// Expo throws error if it sees __fbBatchedBridgeConfig in loaded modules

// Mock ErrorUtils for web
if (typeof global !== 'undefined' && !global.ErrorUtils) {
  global.ErrorUtils = {
    setGlobalHandler: (callback) => {
      if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
          callback(event.error, false);
        });
        window.addEventListener('unhandledrejection', (event) => {
          callback(event.reason, true);
        });
      }
    },
    getGlobalHandler: () => (error) => {
      console.error('Global error:', error);
    },
    reportFatalError: (error) => {
      // Don't throw - just log to avoid LogBox setImmediate errors
      console.error('Fatal error:', error);
      if (error && error.stack) {
        console.error(error.stack);
      }
    },
    reportException: (error, isFatal) => {
      if (isFatal) {
        console.error('Fatal exception:', error);
      } else {
        console.warn('Exception:', error);
      }
    },
  };
}

// Mock Platform-specific constants
const PlatformConstants = {
  isTesting: false,
  reactNativeVersion: { major: 0, minor: 73, patch: 6 },
  Version: 33,
  Model: 'web',
};

// Mock TurboModuleRegistry - CRITICAL: Must work as both named and default export
const TurboModuleRegistry = {
  get: (name) => {
    console.warn(`TurboModuleRegistry.get("${name}") called on web - returning null`);
    return null;
  },
  getEnforcing: (name) => {
    console.warn(`TurboModuleRegistry.getEnforcing("${name}") called on web - returning null`);
    return null;
  },
};

// Mock NativeModules
const NativeModules = {
  PlatformConstants,
  SourceCode: {
    scriptURL: typeof window !== 'undefined' ? window.location.href : '',
  },
  BlobModule: null, // Blob operations not supported on web via native module
  FileReaderModule: null,
  // Stripe SDK shim
  StripeSdk: {
    getConstants: () => ({}),
    initialise: () => Promise.resolve(),
    createPaymentMethod: () => Promise.reject(new Error('Use Stripe.js on web')),
    confirmPayment: () => Promise.reject(new Error('Use Stripe.js on web')),
    initPaymentSheet: () => Promise.reject(new Error('Use Stripe Elements on web')),
    presentPaymentSheet: () => Promise.reject(new Error('Not supported on web')),
  },
};

// Mock NativePerformance
const NativePerformance = {
  mark: () => {},
  measure: () => {},
  getSimpleMemoryInfo: () => ({}),
  getReactNativeStartupTiming: () => ({}),
};

// Mock PerformanceObserver
const PerformanceObserver = null;

// Set globally as well
if (typeof global !== 'undefined') {
  global.PlatformConstants = PlatformConstants;
  global.__PlatformConstants = PlatformConstants;
  global.nativeModuleProxy = NativeModules;
  global.TurboModuleRegistry = TurboModuleRegistry;
  global.NativePerformance = NativePerformance;
  global.PerformanceObserver = PerformanceObserver;
}

// Export as named exports
export { TurboModuleRegistry, NativeModules, PlatformConstants, NativePerformance, PerformanceObserver };

// CRITICAL: Export TurboModuleRegistry as default for imports like:
// import TurboModuleRegistry from '...TurboModuleRegistry'
export default TurboModuleRegistry;
