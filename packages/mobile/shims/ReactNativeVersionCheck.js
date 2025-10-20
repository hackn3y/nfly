/**
 * ReactNativeVersionCheck shim for web
 * Provides version checking compatibility
 */

export function checkVersions() {
  // On web, version check always passes
  // We've already set up PlatformConstants with matching versions
  return;
}

export default {
  checkVersions,
};
