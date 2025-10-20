const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');
const path = require('path');
const { getWatchFolders } = require('@expo/metro-config/build/getWatchFolders');
const { getModulesPaths } = require('@expo/metro-config/build/getModulesPaths');

const config = getDefaultConfig(__dirname);

const workspaceRoot = path.resolve(__dirname, '../..');
const shimPath = path.join(__dirname, 'shims', 'react-native-web.js');

// Map React Native Web exports
const rnWebPath = path.join(workspaceRoot, 'node_modules', 'react-native-web', 'dist');
const platformShim = path.join(rnWebPath, 'exports', 'Platform', 'index.js');
const imageShim = path.join(rnWebPath, 'exports', 'Image', 'index.js');
const backHandlerShim = path.join(rnWebPath, 'exports', 'BackHandler', 'index.js');

// Use Expo's helpers so Metro follows the workspace graph
config.watchFolders = getWatchFolders(__dirname);
config.resolver.nodeModulesPaths = getModulesPaths(__dirname);

config.resolver.extraNodeModules = {
	...(config.resolver.extraNodeModules || {}),
};

const originalResolveRequest = config.resolver.resolveRequest || resolve;

config.resolver.resolveRequest = (context, moduleName, platform) => {
	// Only apply shims for web platform
	if (platform !== 'web') {
		return originalResolveRequest(context, moduleName, platform);
	}

	const normalized = moduleName.replace(/\\/g, '/');

	// Debug logging for Platform resolution
	if (normalized.includes('Platform') && normalized.includes('Utilities')) {
		console.log('[Metro Resolver] Resolving Platform module:', normalized, '-> ', platformShim);
	}

	// Check if this is a React Native internal module that needs shimming
	// Platform-related modules
	if (
		normalized.includes('/Utilities/Platform') ||
		normalized === './Platform' ||
		normalized.endsWith('/Platform')
	) {
		return {
			type: 'sourceFile',
			filePath: platformShim,
		};
	}

	// Image-related modules
	if (
		normalized.includes('/Image/Image') ||
		(normalized.endsWith('/Image') && normalized.includes('Libraries'))
	) {
		return {
			type: 'sourceFile',
			filePath: imageShim,
		};
	}

	// BackHandler
	if (
		normalized.includes('/Utilities/BackHandler') ||
		normalized.includes('/BackHandler')
	) {
		return {
			type: 'sourceFile',
			filePath: backHandlerShim,
		};
	}

	// PlatformColorValueTypes
	if (
		normalized.includes('PlatformColorValueTypes') ||
		normalized === './PlatformColorValueTypes'
	) {
		return {
			type: 'sourceFile',
			filePath: shimPath,
		};
	}

	// ReactNativeVersionCheck - must be shimmed
	if (normalized.includes('ReactNativeVersionCheck')) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'ReactNativeVersionCheck.js'),
		};
	}

	// Blob modules - not needed on web
	if (
		normalized.includes('NativeBlobModule') ||
		normalized.includes('BlobModule') ||
		normalized.includes('FileReaderModule')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'NativeBlobModule.js'),
		};
	}

	// BugReporting - use console on web
	if (
		normalized.includes('BugReporting') ||
		normalized.includes('/Core/Devtools/BugReporting')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'BugReporting.js'),
		};
	}

	// TaskSupport - use web APIs
	if (
		normalized.includes('TaskSupport') ||
		normalized.includes('/ReactNative/TaskSupport')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'TaskSupport.js'),
		};
	}

	// DeviceInfo - use web APIs
	if (
		normalized.includes('DeviceInfo') ||
		normalized.includes('NativeDeviceInfo')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'DeviceInfo.js'),
		};
	}

	// UIManager - use DOM APIs on web
	if (
		normalized.includes('UIManager') ||
		normalized.includes('NativeUIManager') ||
		normalized.includes('PaperUIManager')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'UIManager.js'),
		};
	}

	// Timing - use browser timing APIs
	if (
		normalized.includes('NativeTiming') ||
		normalized.includes('Timing')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'Timing.js'),
		};
	}

	// Animated - no native animation on web
	if (
		normalized.includes('NativeAnimatedModule') ||
		normalized.includes('NativeAnimatedHelper') ||
		normalized.includes('NativeAnimatedTurboModule')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'NativeAnimatedModule.js'),
		};
	}

	// TimingAnimation - mock animation class for web
	if (
		normalized.includes('TimingAnimation') ||
		moduleName.includes('TimingAnimation')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'TimingAnimation.js'),
		};
	}

	// Stripe - use Stripe.js on web
	if (
		normalized.includes('StripeSdk') ||
		normalized.includes('@stripe/stripe-react-native')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'StripeSdk.js'),
		};
	}

	// Native modules - must be shimmed for web
	if (
		normalized.includes('NativeModules') ||
		normalized.includes('TurboModuleRegistry') ||
		normalized.includes('NativePerformance') ||
		normalized.includes('PlatformConstants') ||
		normalized.includes('ReactNativeVersion')
	) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'native-modules.js'),
		};
	}

	// React Native Vector Icons - use emoji fallback for web
	if (moduleName.startsWith('react-native-vector-icons')) {
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'react-native-vector-icons.js'),
		};
	}

	// expo-secure-store - use localStorage on web
	if (moduleName === 'expo-secure-store' || normalized.includes('expo-secure-store')) {
		console.log('[Metro] Intercepting expo-secure-store for web');
		return {
			type: 'sourceFile',
			filePath: path.join(__dirname, 'shims', 'expo-secure-store.js'),
		};
	}

	// Other internal modules that need shimming
	const internalModulePatterns = [
		'BaseViewConfig',
		'legacySendAccessibilityEvent',
		'RCTAlertManager',
		'RCTNetworking',
		'DevToolsSettingsManager',
	];

	for (const pattern of internalModulePatterns) {
		if (normalized.includes(pattern)) {
			return {
				type: 'sourceFile',
				filePath: shimPath,
			};
		}
	}

	return originalResolveRequest(context, moduleName, platform);
};

module.exports = config;
