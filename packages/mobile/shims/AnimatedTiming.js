/**
 * AnimatedTiming shim for web
 * Provides no-op timing animations to prevent Stack Navigator crashes
 */

class TimingAnimation {
  constructor(config) {
    this._config = config || {};
    this._toValue = config?.toValue || 0;
    this._onEnd = null;
  }

  start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
    this._onEnd = onEnd;
    
    // Immediately jump to final value (no animation)
    if (onUpdate) {
      onUpdate(this._toValue);
    }
    
    // Call onEnd callback synchronously
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

export default TimingAnimation;
