import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../services/api';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Got push token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Save push token to backend
 */
export async function savePushToken(token) {
  if (!token) return;

  try {
    await api.post('/users/push-token', { pushToken: token });
    console.log('Push token saved to backend');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(navigation) {
  // Handle notification received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Handle notification tapped/clicked
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);

    const data = response.notification.request.content.data;

    // Navigate based on notification type
    if (data.screen) {
      navigation.navigate(data.screen, data);
    } else if (data.type === 'new_predictions') {
      navigation.navigate('Predictions');
    } else if (data.type === 'favorite_team_game' || data.type === 'high_confidence') {
      if (data.gameId) {
        navigation.navigate('GameDetails', { gameId: data.gameId });
      }
    } else if (data.type === 'milestone') {
      navigation.navigate('Profile', { screen: 'MyStatistics' });
    }
  });

  return {
    notificationListener,
    responseListener,
  };
}

/**
 * Clean up notification listeners
 */
export function cleanupNotificationListeners(listeners) {
  if (listeners.notificationListener) {
    Notifications.removeNotificationSubscription(listeners.notificationListener);
  }
  if (listeners.responseListener) {
    Notifications.removeNotificationSubscription(listeners.responseListener);
  }
}
