const path = require('path');
const { createExpoWebpackConfigAsync } = require('@expo/webpack-config');

const workspaceRoot = path.resolve(__dirname, '..', '..');
const reactNativeWebExports = path.join(
  workspaceRoot,
  'node_modules',
  'react-native-web',
  'dist',
  'exports'
);
const expoVectorIcons = path.join(workspaceRoot, 'node_modules', '@expo', 'vector-icons');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Use custom HTML template with setImmediate polyfill
  if (config.plugins) {
    const HtmlWebpackPlugin = config.plugins.find(
      plugin => plugin.constructor.name === 'HtmlWebpackPlugin'
    );
    if (HtmlWebpackPlugin) {
      HtmlWebpackPlugin.userOptions.template = path.join(__dirname, 'web', 'index.html');
    }
  }

  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react-native$': 'react-native-web',
    'react-native/Libraries/Utilities/Platform': path.join(
      reactNativeWebExports,
      'Platform',
      'index.js'
    ),
    'react-native/Libraries/Image/Image': path.join(
      reactNativeWebExports,
      'Image',
      'index.js'
    ),
    '@react-native-vector-icons': expoVectorIcons,
    '@react-native-vector-icons/material-design-icons': path.join(
      expoVectorIcons,
      'MaterialIcons.js'
    ),
    '@react-native-vector-icons/MaterialCommunityIcons': path.join(
      expoVectorIcons,
      'MaterialCommunityIcons.js'
    ),
    // Use web-specific navigation files
    './MainNavigator': path.join(__dirname, 'src', 'navigation', 'MainNavigator.web.js'),
    // Alias react-native-web's internal animation modules to our shims
    'react-native-web/dist/vendor/react-native/Animated/animations/TimingAnimation': path.join(
      __dirname,
      'shims',
      'TimingAnimation.js'
    ),
    'react-native-web/dist/modules/NativeAnimatedModule': path.join(
      __dirname,
      'shims',
      'NativeAnimatedModule.js'
    ),
  };

  return config;
};
