// firebase.ts

import { initializeApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDKD8Ebab7dKi3FXGqQlg-fadf71of55lA",
  appId: "1:533041299457:android:87062efb35a6d0c7a84000",
  projectId: "lichhoc-beb3e",
  storageBucket: "lichhoc-beb3e.firebasestorage.app",
  messagingSenderId: "533041299457",
  authDomain: undefined, // Android không dùng
};

const app = initializeApp(firebaseConfig);

// Yêu cầu quyền thông báo
export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) console.log('Notification permission granted.');
}

// Lấy FCM Token
export async function getFCMToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
}

// Xử lý thông báo foreground
export function foregroundListener() {
  messaging().onMessage(async remoteMessage => {
    console.log('FCM Foreground message:', remoteMessage);
  });
}

// Xử lý thông báo background / quit
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FCM Background message:', remoteMessage);
});

export { app, messaging };
