/**
 * NativeAnimatedModule shim for web
 * Web uses JavaScript-driven animations, no native module needed
 */

// Create a mock TimingAnimation class that does nothing
class TimingAnimation {
  constructor(config) {
    this._config = config || {};
    this._toValue = (config && config.toValue) || 0;
    this._onEnd = null;
  }

  start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
    this._onEnd = onEnd;
    
    // Immediately jump to final value (no animation on web)
    if (onUpdate) {
      onUpdate(this._toValue);
    }
    
    // Call onEnd callback
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

// Patch react-native-web's Animated module if it exists
if (typeof window !== 'undefined') {
  try {
    // Try to patch the animation module globally
    window.__TimingAnimation = TimingAnimation;
  } catch (e) {
    console.warn('[NativeAnimatedModule] Could not patch TimingAnimation:', e);
  }
}

// Create a mock batched bridge for animations
const mockBatchedBridge = {
  flushedQueue: () => null,
  invokeCallbackAndReturnFlushedQueue: () => null,
  callFunctionReturnFlushedQueue: () => null,
  flushQueue: () => null,
};

const NativeAnimatedModule = {
  // Create animated nodes
  createAnimatedNode: () => {},
  startListeningToAnimatedNodeValue: () => {},
  stopListeningToAnimatedNodeValue: () => {},
  connectAnimatedNodes: () => {},
  disconnectAnimatedNodes: () => {},
  startAnimatingNode: () => {},
  stopAnimation: () => {},
  setAnimatedNodeValue: () => {},
  setAnimatedNodeOffset: () => {},
  flattenAnimatedNodeOffset: () => {},
  extractAnimatedNodeOffset: () => {},
  connectAnimatedNodeToView: () => {},
  disconnectAnimatedNodeFromView: () => {},
  restoreDefaultValues: () => {},
  dropAnimatedNode: () => {},
  addAnimatedEventToView: () => {},
  removeAnimatedEventFromView: () => {},
  queueAndExecuteBatchedOperations: () => {},
  
  // Additional methods
  addListener: () => {},
  removeListeners: () => {},
  getValue: (callback) => callback && callback(0),
  
  // Add the batched bridge for useAnimatedProps
  __mockBatchedBridge: mockBatchedBridge,
  
  // Export TimingAnimation
  TimingAnimation,
};

// Ensure global bridge exists for animation hooks on all global objects
const ensureBatchedBridge = (target) => {
  if (typeof target !== 'undefined') {
    if (!target.__fbBatchedBridge) {
      target.__fbBatchedBridge = mockBatchedBridge;
    } else if (!target.__fbBatchedBridge.flushQueue) {
      target.__fbBatchedBridge = {
        ...target.__fbBatchedBridge,
        ...mockBatchedBridge,
      };
    }
  }
};

// Apply to all global contexts
ensureBatchedBridge(typeof window !== 'undefined' ? window : undefined);
ensureBatchedBridge(typeof global !== 'undefined' ? global : undefined);
ensureBatchedBridge(typeof globalThis !== 'undefined' ? globalThis : undefined);

export default NativeAnimatedModule;
export { TimingAnimation };
