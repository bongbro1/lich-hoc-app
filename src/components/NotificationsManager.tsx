import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { InteractionManager, Platform } from 'react-native';
import { AlertOptions, useAlert } from '../contexts/AlertContext';
import { DaySchedule } from '../models/schedule';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSameDay } from '../utils/date';
import * as RootNavigation from '../navigation/RootNavigation';
import { Friend_Near } from '../types/typesChat';
import { handleNotificationRedirect } from '../helpers/notificationRedirect';
import { useInAppNotification } from '../contexts/InAppNotificationContext';
import { setPendingNotification } from '../helpers/notificationQueue';

import { NotificationService } from '../services/notificationService';

export async function requestNotificationPermission(): Promise<boolean> {
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleThreeDaysNotifications() {
  await NotificationService.scheduleThreeDaysNotifications();
}

// 🚀 BẮT NOTIFICATION (Foreground & Background)
export function useNotificationListeners() {
  const { showBanner } = useInAppNotification();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          const data = response.notification.request.content.data;
          // Xử lý chuyển hướng ngay khi app khởi động từ notification
          handleNotificationRedirect(data);
        }
      } catch (e) {
        console.warn('getLastNotificationResponseAsync error', e);
      }
    });

    return () => task.cancel();
  }, []);

  // 1. Nhận notification khi đang ở Foreground
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification Received in Foreground:', notification);

      const { title, body, data } = notification.request.content;

      // Kiểm tra nếu đang ở đúng màn hình chat thì không hiện banner
      const currentRoute = RootNavigation.getCurrentRoute();
      const params = currentRoute?.params as any;
      const notificationData = data as any;

      const isChattingWithThisUser =
        currentRoute?.name === 'ChatDetailScreen' &&
        String(params?.conversationId) === String(notificationData?.conversationId);

      if (isChattingWithThisUser) {
        return;
      }

      // Hiển thị In-App Banner
      if (title && body) {
        showBanner({
          title,
          body,
          data
        });
      }
    });

    return () => sub.remove();
  }, [showBanner]);

  // 2. Nhận hành động khi người dùng TAP vào notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 User tapped notification:', response);
      const data = response.notification.request.content.data;
      handleNotificationRedirect(data);
    });

    return () => sub.remove();
  }, []);
}
