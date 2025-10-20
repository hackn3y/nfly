// Shim for expo-secure-store on web
// expo-secure-store is not supported on web, so we use localStorage instead

const isWeb = typeof window !== 'undefined' && window.localStorage;

// Main async functions
export async function setItemAsync(key, value, options) {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch (error) {
      console.error('[SecureStore] Error setting item:', error);
      throw error;
    }
  }
  throw new Error('SecureStore is not available');
}

export async function getItemAsync(key, options) {
  if (isWeb) {
    try {
      const value = window.localStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('[SecureStore] Error getting item:', error);
      return null;
    }
  }
  return null;
}

export async function deleteItemAsync(key, options) {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
      return;
    } catch (error) {
      console.error('[SecureStore] Error deleting item:', error);
      throw error;
    }
  }
  throw new Error('SecureStore is not available');
}

// Additional methods that expo-secure-store may call
export function isAvailableAsync() {
  return Promise.resolve(isWeb);
}

// Mock the native module methods (these are internal)
export const getValueWithKeyAsync = getItemAsync;
export const setValueWithKeyAsync = setItemAsync;
export const deleteValueWithKeyAsync = deleteItemAsync;

// Default export that matches expo-secure-store's structure
const SecureStore = {
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
  isAvailableAsync,
  getValueWithKeyAsync,
  setValueWithKeyAsync,
  deleteValueWithKeyAsync,
};

export default SecureStore;
