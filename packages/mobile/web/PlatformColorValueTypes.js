// Minimal web shim for native PlatformColor helpers used in processColor.
// On web we fall back to returning simple color values and ignore platform semantics.

const unwrapColor = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'object') {
    // Prefer explicit light value, otherwise pick the first available entry.
    const { light, dark, highContrastLight, highContrastDark } = value;
    return light ?? dark ?? highContrastLight ?? highContrastDark ?? null;
  }

  return null;
};

const PlatformColor = (...names) => {
  // Return the first token; web callers treat this as a plain color string.
  return names[0] ?? null;
};

const DynamicColorIOSPrivate = (tuple = {}) => unwrapColor(tuple);

const normalizeColorObject = (color) => unwrapColor(color);

const processColorObject = (color) => unwrapColor(color);

module.exports = {
  PlatformColor,
  DynamicColorIOSPrivate,
  normalizeColorObject,
  processColorObject,
};
