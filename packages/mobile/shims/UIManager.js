/**
 * UIManager shim for web
 * Web uses DOM directly, no native UI manager needed
 */

const UIManager = {
  // View measurement
  measure: (node, callback) => {
    if (node && node.getBoundingClientRect) {
      const rect = node.getBoundingClientRect();
      callback(rect.left, rect.top, rect.width, rect.height, rect.left, rect.top);
    } else {
      callback(0, 0, 0, 0, 0, 0);
    }
  },

  measureInWindow: (node, callback) => {
    if (node && node.getBoundingClientRect) {
      const rect = node.getBoundingClientRect();
      callback(rect.left, rect.top, rect.width, rect.height);
    } else {
      callback(0, 0, 0, 0);
    }
  },

  measureLayout: (node, relativeToNativeNode, onFail, onSuccess) => {
    if (node && node.getBoundingClientRect && relativeToNativeNode && relativeToNativeNode.getBoundingClientRect) {
      const rect = node.getBoundingClientRect();
      const relativeRect = relativeToNativeNode.getBoundingClientRect();
      onSuccess(
        rect.left - relativeRect.left,
        rect.top - relativeRect.top,
        rect.width,
        rect.height
      );
    } else {
      onFail && onFail();
    }
  },

  // Focus management
  focus: (node) => {
    if (node && node.focus) {
      node.focus();
    }
  },

  blur: (node) => {
    if (node && node.blur) {
      node.blur();
    }
  },

  // View configuration
  getViewManagerConfig: (name) => {
    return {};
  },

  getConstants: () => {
    return {};
  },

  // Accessibility
  setAccessibilityFocus: () => {},
  sendAccessibilityEvent: () => {},

  // Direct manipulation (not supported on web)
  setChildren: () => {},
  manageChildren: () => {},
  replaceExistingNonRootView: () => {},
  setJSResponder: () => {},
  clearJSResponder: () => {},
  findSubviewIn: () => {},

  // Commands
  dispatchViewManagerCommand: () => {},
};

export default UIManager;
