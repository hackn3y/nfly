import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cross-platform storage utility
 * Uses SecureStore on iOS/Android and AsyncStorage on web
 */
const storage = {
  async getItemAsync(key) {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async setItemAsync(key, value) {
    if (Platform.OS === 'web') {
      return await AsyncStorage.setItem(key, value);
    } else {
      return await SecureStore.setItemAsync(key, value);
    }
  },

  async deleteItemAsync(key) {
    if (Platform.OS === 'web') {
      return await AsyncStorage.removeItem(key);
    } else {
      return await SecureStore.deleteItemAsync(key);
    }
  },
};

export default storage;
