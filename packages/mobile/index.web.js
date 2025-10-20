/**
 * Web Setup - Initialize native bridge mocks before app loads
 */

// CRITICAL: Load animation polyfill FIRST before any React Native code
import './shims/animation-polyfill';

// CRITICAL: Polyfill setImmediate SECOND - must be available globally before ANY other code runs
(function() {
  const setImmediatePolyfill = function(callback) {
    var args = Array.prototype.slice.call(arguments, 1);
    return setTimeout(function() {
      callback.apply(null, args);
    }, 0);
  };
  
  const clearImmediatePolyfill = function(id) {
    clearTimeout(id);
  };

  // Set on window
  if (typeof window !== 'undefined') {
    window.setImmediate = setImmediatePolyfill;
    window.clearImmediate = clearImmediatePolyfill;
  }
  
  // Set on global
  if (typeof global !== 'undefined') {
    global.setImmediate = setImmediatePolyfill;
    global.clearImmediate = clearImmediatePolyfill;
  }

  // Set on globalThis (most reliable)
  if (typeof globalThis !== 'undefined') {
    globalThis.setImmediate = setImmediatePolyfill;
    globalThis.clearImmediate = clearImmediatePolyfill;
  }
})();

// Set up global native bridge mock for web
if (typeof window !== 'undefined') {

  // Mock the batched bridge config
  window.__fbBatchedBridgeConfig = {
    remoteModuleConfig: [],
    localModulesConfig: [],
  };

  // Mock the batched bridge - CRITICAL for animations
  const batchedBridge = {
    callFunctionReturnFlushedQueue: () => null,
    invokeCallbackAndReturnFlushedQueue: () => null,
    flushedQueue: () => null,
    callFunctionReturnResultAndFlushedQueue: () => null,
    flushQueue: () => null,  // Required by useAnimatedProps
    getEventLoopRunningTime: () => 0,
    registerCallableModule: () => {},
    registerLazyCallableModule: () => {},
    setGlobalErrorHandler: () => {},
    // Additional methods for animation support
    enqueueNativeCall: () => {},
    callNativeSyncHook: () => null,
  };

  // Set on window
  window.__fbBatchedBridge = batchedBridge;

  // CRITICAL: Also set on global for modules that access it differently
  if (typeof global !== 'undefined') {
    global.__fbBatchedBridge = batchedBridge;
  }

  // CRITICAL: Set on globalThis for maximum compatibility
  if (typeof globalThis !== 'undefined') {
    globalThis.__fbBatchedBridge = batchedBridge;
  }

  // Also expose via require for bundled modules
  try {
    if (typeof __webpack_require__ !== 'undefined') {
      // Store reference for webpack modules
      window.__webpack_batched_bridge__ = batchedBridge;
    }
  } catch (e) {
    // Silently fail if webpack not available
  }

  // Mock ErrorUtils for web - CRITICAL: Don't throw to avoid LogBox setImmediate errors
  window.ErrorUtils = {
    setGlobalHandler: (callback) => {
      window.addEventListener('error', (event) => {
        callback(event.error, false);
      });
      window.addEventListener('unhandledrejection', (event) => {
        callback(event.reason, true);
      });
    },
    getGlobalHandler: () => (error) => {
      console.error('Global error:', error);
    },
    reportFatalError: (error) => {
      // Don't throw - just log. Throwing triggers LogBox which needs setImmediate
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

  // Mock TurboModuleRegistry
  window.TurboModuleRegistry = {
    get: (name) => {
      console.warn(`TurboModuleRegistry.get("${name}") called but not available on web`);
      return null;
    },
    getEnforcing: (name) => {
      console.warn(`TurboModuleRegistry.getEnforcing("${name}") called but not available on web`);
      return null;
    },
  };

  // Mock TimingAnimation for Stack Navigator compatibility
  // This prevents "TimingAnimation is not a constructor" errors
  class TimingAnimation {
    constructor(config) {
      this._config = config || {};
      this._toValue = (config && config.toValue) || 0;
      this._onEnd = null;
      this._animationId = null;
    }

    start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
      this._onEnd = onEnd;

      // Immediately set to final value (no animation on web)
      if (onUpdate) {
        onUpdate(this._toValue);
      }

      // Notify completion
      if (onEnd) {
        onEnd({ finished: true });
      }
    }

    stop() {
      if (this._onEnd) {
        this._onEnd({ finished: false });
      }
    }

    __getNativeAnimationConfig() {
      return {
        type: 'timing',
        toValue: this._toValue,
      };
    }
  }

  // Store globally so react-native-web can find it
  window.__TimingAnimation = TimingAnimation;
  if (typeof global !== 'undefined') {
    global.__TimingAnimation = TimingAnimation;
  }

  // CRITICAL FIX: Patch require to return our TimingAnimation
  // This intercepts module loading to fix animation errors
  const originalRequire = typeof __webpack_require__ !== 'undefined' ? __webpack_require__ : null;
  if (originalRequire) {
    const patchedRequire = function(moduleId) {
      const result = originalRequire.apply(this, arguments);

      // Patch TimingAnimation modules
      if (result && result.default === undefined &&
          (moduleId.includes('TimingAnimation') ||
           moduleId.includes('animations/TimingAnimation'))) {
        // Wrap our TimingAnimation as a module
        return {
          default: TimingAnimation,
          __esModule: true,
          TimingAnimation
        };
      }

      return result;
    };

    // Copy properties from original require
    Object.setPrototypeOf(patchedRequire, originalRequire);
    for (let prop in originalRequire) {
      if (originalRequire.hasOwnProperty(prop)) {
        patchedRequire[prop] = originalRequire[prop];
      }
    }

    // Replace global require
    if (typeof window !== 'undefined') {
      window.__webpack_require__ = patchedRequire;
    }
  }

  // Mock PlatformConstants - CRITICAL for version check
  const mockPlatformConstants = {
    isTesting: false,
    reactNativeVersion: { major: 0, minor: 73, patch: 6 },
    Version: 33,
    Model: 'web',
  };

  window.__PlatformConstants = mockPlatformConstants;
  
  // Create NativeModules proxy with PlatformConstants
  window.nativeModuleProxy = {
    PlatformConstants: mockPlatformConstants,
    SourceCode: {
      scriptURL: window.location.href,
    },
  };

  // Set on global object as well for compatibility
  if (typeof global !== 'undefined') {
    global.ErrorUtils = window.ErrorUtils;
    global.TurboModuleRegistry = window.TurboModuleRegistry;
    global.__PlatformConstants = mockPlatformConstants;
    global.nativeModuleProxy = window.nativeModuleProxy;
  }

  // Suppress React Native web warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      (msg.includes('fbBatchedBridge') ||
        msg.includes('NativeModules') ||
        msg.includes('TurboModule'))
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Now load the main app
import 'expo/build/Expo.fx';
import { registerRootComponent } from 'expo';
import { activateKeepAwakeAsync } from 'expo-keep-awake';

import App from './App';

if (__DEV__) {
  activateKeepAwakeAsync();
}

registerRootComponent(App);
