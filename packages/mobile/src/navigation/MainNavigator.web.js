import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/main/HomeScreen';
import PredictionsScreen from '../screens/main/PredictionsScreen';
import GematriaScreen from '../screens/main/GematriaScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { colors } from '../theme';

// Simple web-only navigation without animations
export default function MainNavigator() {
  const [activeTab, setActiveTab] = useState('Home');

  const tabs = [
    { name: 'Home', component: HomeScreen, icon: 'home', label: 'Dashboard' },
    { name: 'Predictions', component: PredictionsScreen, icon: 'chart-line', label: 'Predictions' },
    { name: 'Gematria', component: GematriaScreen, icon: 'calculator', label: 'Gematria' },
    { name: 'Profile', component: ProfileScreen, icon: 'account', label: 'Profile' },
  ];

  const ActiveComponent = tabs.find(tab => tab.name === activeTab)?.component || HomeScreen;

  // Set initial title immediately
  if (typeof document !== 'undefined' && !document.title.includes('-')) {
    document.title = 'Dashboard - NFL Predictor';
  }

  // Update document title on tab change
  React.useEffect(() => {
    const activeTabInfo = tabs.find(tab => tab.name === activeTab);
    if (activeTabInfo && typeof document !== 'undefined') {
      document.title = `${activeTabInfo.label} - NFL Predictor`;
    }
  }, [activeTab]);

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        <ActiveComponent navigation={{ navigate: setActiveTab }} />
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => setActiveTab(tab.name)}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={activeTab === tab.name ? colors.primary : colors.placeholder}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.name ? colors.primary : colors.placeholder }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});