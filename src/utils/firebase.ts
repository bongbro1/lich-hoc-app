// This file is deprecated and was using @react-native-firebase which is incompatible with Expo Go.
// Use src/configs/firebase.ts for Firebase JS SDK instead.
// For push notifications in Expo Go, use expo-notifications (as implemented in notificationService.ts).

export const requestUserPermission = async () => {
  console.log('Push notifications via native Firebase messaging are disabled in Expo Go.');
};

export const getFCMToken = async () => {
  return null;
};

export const foregroundListener = () => {};

export default {};
