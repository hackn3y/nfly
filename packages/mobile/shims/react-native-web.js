/**
 * Comprehensive React Native Web Shims
 * Provides web-compatible exports for React Native internals
 */

// Platform Color Types - not supported on web
export const PlatformColor = () => null;
export const DynamicColorIOS = () => null;
export const normalizeColor = (color) => color;
export const processColor = (color) => color;

// Accessibility - stub implementations
export const legacySendAccessibilityEvent = () => {};
export const sendAccessibilityEvent = () => {};

// BackHandler - not applicable on web
export const BackHandler = {
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
  exitApp: () => {}
};

// Alert - use browser alert
export const Alert = {
  alert: (title, message, buttons) => {
    if (typeof window !== 'undefined') {
      window.alert(message || title);
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  },
  prompt: () => {}
};

// DevTools Settings - not needed on web
export const DevToolsSettingsManager = {
  getConsolePatchSettings: () => 'DEPRECATED',
  setConsolePatchSettings: () => {},
  reload: () => {}
};

// Networking - use fetch API
export const RCTNetworking = {
  addListener: () => {},
  removeListeners: () => {}
};

// Image - re-export from react-native-web
let ImageComponent;
try {
  const RNWeb = require('react-native-web');
  ImageComponent = RNWeb.Image;
} catch (e) {
  ImageComponent = 'img';
}
export const Image = ImageComponent;

// Platform - re-export from react-native-web
let PlatformModule;
try {
  const RNWeb = require('react-native-web');
  PlatformModule = RNWeb.Platform;
} catch (e) {
  PlatformModule = {
    OS: 'web',
    Version: 1,
    select: (obj) => obj.web || obj.default,
    isTV: false,
    isTesting: false
  };
}
export const Platform = PlatformModule;

// Base View Config - not needed on web
export const BaseViewConfig = {
  baseProps: {},
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {}
};

// Export everything as default too
export default {
  PlatformColor,
  DynamicColorIOS,
  normalizeColor,
  processColor,
  legacySendAccessibilityEvent,
  sendAccessibilityEvent,
  BackHandler,
  Alert,
  DevToolsSettingsManager,
  RCTNetworking,
  Image,
  Platform,
  BaseViewConfig
};
