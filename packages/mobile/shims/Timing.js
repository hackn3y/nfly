/**
 * NativeTiming shim for web
 * Web uses browser's native timing APIs
 */

const Timing = {
  createTimer: (callbackID, duration, jsSchedulingTime, repeats) => {
    const timerId = repeats
      ? setInterval(() => {
          if (typeof global !== 'undefined' && global.__fbBatchedBridge) {
            global.__fbBatchedBridge.callFunctionReturnFlushedQueue('JSTimers', 'callTimers', [[callbackID]]);
          }
        }, duration)
      : setTimeout(() => {
          if (typeof global !== 'undefined' && global.__fbBatchedBridge) {
            global.__fbBatchedBridge.callFunctionReturnFlushedQueue('JSTimers', 'callTimers', [[callbackID]]);
          }
        }, duration);
    
    return timerId;
  },

  deleteTimer: (timerId) => {
    clearTimeout(timerId);
    clearInterval(timerId);
  },

  setSendIdleEvents: () => {
    // No-op on web
  },
};

export default Timing;
