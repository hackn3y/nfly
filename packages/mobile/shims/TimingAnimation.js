// Shim for React Native's TimingAnimation (web compatibility)
// The TimingAnimation class is used by react-native-web for animations
// but is not compatible with web without the native bridge

class TimingAnimation {
  constructor(config) {
    this._config = config || {};
    this._animationId = null;
    this._onUpdate = null;
  }

  start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
    this._onUpdate = onUpdate;
    
    // Immediately call onEnd to skip the animation
    if (onEnd) {
      // Use setImmediate or setTimeout to make it async
      const complete = () => {
        if (onEnd) {
          onEnd({ finished: true });
        }
      };
      
      if (typeof setImmediate !== 'undefined') {
        setImmediate(complete);
      } else {
        setTimeout(complete, 0);
      }
    }
    
    return this;
  }

  stop() {
    // No-op on web
  }
}

// Export as default to match React Native's export
export default TimingAnimation;

// Also export named for compatibility
export { TimingAnimation };
