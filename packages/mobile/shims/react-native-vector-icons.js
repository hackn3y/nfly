// Web shim for react-native-vector-icons
// On web, we'll use a simple fallback or you can integrate with react-icons or fontawesome
import React from 'react';
import { Text, View } from 'react-native';

// Simple fallback icon component for web
const Icon = ({ name, size = 24, color = '#000', style, ...props }) => {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      {...props}
    >
      <Text style={{ fontSize: size * 0.7, color }}>
        {getIconEmoji(name)}
      </Text>
    </View>
  );
};

// Map common icon names to emoji equivalents for web
function getIconEmoji(name) {
  const iconMap = {
    home: '🏠',
    'chart-line': '📈',
    calculator: '🔢',
    account: '👤',
    'account-circle': '👤',
    menu: '☰',
    close: '✕',
    check: '✓',
    'chevron-right': '›',
    'chevron-left': '‹',
    'chevron-down': '⌄',
    'chevron-up': '⌃',
    star: '⭐',
    'star-outline': '☆',
    heart: '❤️',
    'heart-outline': '♡',
    settings: '⚙️',
    logout: '🚪',
    login: '🔑',
    email: '📧',
    lock: '🔒',
    eye: '👁️',
    'eye-off': '👁️',
    plus: '+',
    minus: '-',
    delete: '🗑️',
    edit: '✏️',
    share: '🔗',
    'arrow-left': '←',
    'arrow-right': '→',
    'arrow-up': '↑',
    'arrow-down': '↓',
  };

  return iconMap[name] || '●';
}

// Export default Icon component
export default Icon;

// Also export as MaterialCommunityIcons for specific imports
export { Icon as MaterialCommunityIcons };
