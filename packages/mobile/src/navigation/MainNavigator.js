import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/main/HomeScreen';
import PredictionsScreen from '../screens/main/PredictionsScreen';
import GematriaScreen from '../screens/main/GematriaScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import PredictionHistoryScreen from '../screens/main/PredictionHistoryScreen';
import MyStatisticsScreen from '../screens/main/MyStatisticsScreen';
import FavoriteTeamsScreen from '../screens/main/FavoriteTeamsScreen';
import PreferencesScreen from '../screens/main/PreferencesScreen';
import BetHistoryScreen from '../screens/main/BetHistoryScreen';
import PlaceBetScreen from '../screens/main/PlaceBetScreen';
import BetDetailScreen from '../screens/main/BetDetailScreen';
import LivePredictionsScreen from '../screens/main/LivePredictionsScreen';
import PlayerPropsScreen from '../screens/main/PlayerPropsScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import PaymentHistoryScreen from '../screens/main/PaymentHistoryScreen';
import ParlayBuilderScreen from '../screens/main/ParlayBuilderScreen';
import HelpSupportScreen from '../screens/main/HelpSupportScreen';
import TermsOfServiceScreen from '../screens/main/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import ModelStatsScreen from '../screens/main/ModelStatsScreen';
import DataExportScreen from '../screens/main/DataExportScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Profile Stack Navigator
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PredictionHistory" component={PredictionHistoryScreen} />
      <Stack.Screen name="MyStatistics" component={MyStatisticsScreen} />
      <Stack.Screen name="FavoriteTeams" component={FavoriteTeamsScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BetHistory" component={BetHistoryScreen} />
      <Stack.Screen name="PlaceBet" component={PlaceBetScreen} />
      <Stack.Screen name="BetDetail" component={BetDetailScreen} />
      <Stack.Screen name="LivePredictions" component={LivePredictionsScreen} />
      <Stack.Screen name="PlayerProps" component={PlayerPropsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="ParlayBuilder" component={ParlayBuilderScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="ModelStats" component={ModelStatsScreen} />
      <Stack.Screen name="DataExport" component={DataExportScreen} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Predictions"
        component={PredictionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-line" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Gematria"
        component={GematriaScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calculator" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
