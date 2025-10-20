/**
 * DeviceInfo shim for web
 * Provides basic device information using web APIs
 */

const DeviceInfo = {
  getConstants() {
    return {
      Dimensions: {
        window: {
          width: window.innerWidth,
          height: window.innerHeight,
          scale: window.devicePixelRatio || 1,
          fontScale: 1,
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          scale: window.devicePixelRatio || 1,
          fontScale: 1,
        },
      },
    };
  },
};

// Export both named and default
export const Dimensions = {
  get(type) {
    const constants = DeviceInfo.getConstants();
    return constants.Dimensions[type] || constants.Dimensions.window;
  },
  addEventListener() {},
  removeEventListener() {},
};

export default DeviceInfo;
