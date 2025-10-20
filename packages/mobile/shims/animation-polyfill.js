/**
 * Comprehensive Animation Polyfill for React Native Web
 * Fixes TimingAnimation and batched bridge issues
 */

(function() {
  'use strict';

  // Ensure global objects exist
  if (typeof window === 'undefined') return;

  // 1. Create TimingAnimation class
  class TimingAnimation {
    constructor(config) {
      this._config = config || {};
      this._toValue = (config && config.toValue) || 0;
      this._duration = (config && config.duration) || 500;
      this._delay = (config && config.delay) || 0;
      this._onEnd = null;
      this._animationId = null;
      this._startTime = 0;
    }

    start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
      this._onEnd = onEnd;
      const startValue = fromValue || 0;
      const endValue = this._toValue;

      // For web, skip animation and jump to end
      if (this._delay > 0) {
        setTimeout(() => {
          if (onUpdate) onUpdate(endValue);
          if (onEnd) onEnd({ finished: true });
        }, this._delay);
      } else {
        if (onUpdate) onUpdate(endValue);
        if (onEnd) {
          // Use requestAnimationFrame to ensure proper timing
          requestAnimationFrame(() => {
            onEnd({ finished: true });
          });
        }
      }
    }

    stop() {
      if (this._animationId) {
        cancelAnimationFrame(this._animationId);
        this._animationId = null;
      }
      if (this._onEnd) {
        this._onEnd({ finished: false });
      }
    }

    __getNativeAnimationConfig() {
      return {
        type: 'timing',
        toValue: this._toValue,
        duration: this._duration,
        delay: this._delay,
      };
    }
  }

  // 2. Create comprehensive batched bridge
  const batchedBridge = {
    callFunctionReturnFlushedQueue: (module, method, args) => null,
    invokeCallbackAndReturnFlushedQueue: (cbID, args) => null,
    flushedQueue: () => null,
    callFunctionReturnResultAndFlushedQueue: (module, method, args) => null,
    flushQueue: () => null,  // CRITICAL for useAnimatedProps
    getEventLoopRunningTime: () => Date.now(),
    registerCallableModule: (name, methods) => {},
    registerLazyCallableModule: (name, factory) => {},
    setGlobalErrorHandler: (handler) => {},
    enqueueNativeCall: (moduleID, methodID, params, onFail, onSuccess) => {},
    callNativeSyncHook: (moduleID, methodID, params) => null,
    processCallQueue: () => {},
    getCallableModule: (name) => null,
  };

  // 3. Set batched bridge on all global contexts
  window.__fbBatchedBridge = batchedBridge;
  window.__fbBatchedBridgeConfig = {
    remoteModuleConfig: [],
    localModulesConfig: [],
  };

  if (typeof global !== 'undefined') {
    global.__fbBatchedBridge = batchedBridge;
    global.__fbBatchedBridgeConfig = window.__fbBatchedBridgeConfig;
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.__fbBatchedBridge = batchedBridge;
    globalThis.__fbBatchedBridgeConfig = window.__fbBatchedBridgeConfig;
  }

  // 4. Patch module system to inject our TimingAnimation
  // This will override react-native-web's internal TimingAnimation
  const patchModuleSystem = () => {
    // Hook into webpack's module cache
    if (typeof __webpack_require__ !== 'undefined' && __webpack_require__.cache) {
      // Monitor for animation modules being loaded
      const originalDefineProperty = Object.defineProperty;
      Object.defineProperty = function(obj, prop, descriptor) {
        // Intercept TimingAnimation module exports
        if (descriptor && descriptor.value &&
            typeof descriptor.value === 'object' &&
            prop === 'exports') {

          const originalGetter = descriptor.get;
          const originalValue = descriptor.value;

          // Check if this is a TimingAnimation module
          if (originalValue &&
              (originalValue.default && originalValue.default.name === 'TimingAnimation' ||
               originalValue.TimingAnimation)) {
            // Replace with our implementation
            descriptor.value = {
              ...originalValue,
              default: TimingAnimation,
              TimingAnimation: TimingAnimation,
              __esModule: true
            };
          }
        }

        return originalDefineProperty.call(this, obj, prop, descriptor);
      };
    }

    // Also create a global reference
    window._TimingAnimation = TimingAnimation;
    window.__TimingAnimation = TimingAnimation;

    if (typeof global !== 'undefined') {
      global._TimingAnimation = TimingAnimation;
      global.__TimingAnimation = TimingAnimation;
    }
  };

  // 5. Execute patching
  patchModuleSystem();

  // 6. Patch Animated module directly if it exists
  const patchAnimatedModule = () => {
    try {
      // Try to access react-native-web's Animated module
      if (window.Animated) {
        const originalTiming = window.Animated.timing;
        window.Animated.timing = function(value, config) {
          // Use our TimingAnimation for timing animations
          if (!value._startingValue) {
            value._startingValue = value.__getValue();
          }
          const animation = new TimingAnimation(config);
          return {
            start: (callback) => {
              animation.start(
                value.__getValue(),
                (newValue) => value.setValue(newValue),
                callback
              );
            },
            stop: () => animation.stop(),
          };
        };
      }
    } catch (e) {
      // Animated module not yet loaded
    }
  };

  // Try patching immediately and on DOM ready
  patchAnimatedModule();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchAnimatedModule);
  }

  // 7. Override problematic native modules
  window.NativeModules = window.NativeModules || {};
  window.NativeModules.NativeAnimatedModule = {
    startAnimatingNode: () => {},
    stopAnimation: () => {},
    setAnimatedNodeValue: () => {},
    setAnimatedNodeOffset: () => {},
    flattenAnimatedNodeOffset: () => {},
    createAnimatedNode: () => {},
    connectAnimatedNodes: () => {},
    disconnectAnimatedNodes: () => {},
    connectAnimatedNodeToView: () => {},
    disconnectAnimatedNodeFromView: () => {},
    getValue: (tag, callback) => callback(0),
    dropAnimatedNode: () => {},
    addAnimatedEventToView: () => {},
    removeAnimatedEventFromView: () => {},
    startListeningToAnimatedNodeValue: () => {},
    stopListeningToAnimatedNodeValue: () => {},
  };
})();