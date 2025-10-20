/**
 * TaskSupport shim for web
 * Web doesn't need native task scheduling - use standard web APIs
 */

// No-op task support for web
export function scheduleIdleTask(callback) {
  // Use requestIdleCallback if available, otherwise setTimeout
  if (typeof requestIdleCallback !== 'undefined') {
    return requestIdleCallback(callback);
  }
  return setTimeout(callback, 1);
}

export function cancelIdleTask(id) {
  if (typeof cancelIdleCallback !== 'undefined') {
    return cancelIdleCallback(id);
  }
  return clearTimeout(id);
}

export default {
  scheduleIdleTask,
  cancelIdleTask,
};
