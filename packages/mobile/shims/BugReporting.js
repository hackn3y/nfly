/**
 * BugReporting shim for web
 * Web doesn't need native bug reporting - use console/LogBox instead
 */

// No-op functions for bug reporting
export function report(error) {
  console.error('[BugReporting]', error);
}

export function reportError(error) {
  console.error('[BugReporting]', error);
}

export function reportFatalError(error) {
  console.error('[BugReporting] Fatal:', error);
}

export function setExceptionDecorator(decorator) {
  // No-op on web
}

export default {
  report,
  reportError,
  reportFatalError,
  setExceptionDecorator,
};
