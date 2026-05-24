import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../configs/firebase";
import { InsertNotificationParams, NotificationType } from "models/notification";
import { notificationRepo } from "repositories/notificationRepo";
import { getApiBaseUrl } from "../configs/config";
import storageService, { STORAGE_KEYS } from "./storageService";
import { DaySchedule } from "models/schedule";
import { isSameDay } from "../utils/date";

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Service to handle all notification related logic
 */
export const NotificationService = {
  /**
   * Initializes push notifications: requests permissions, gets token, and saves it
   */
  async initialize(studentId: string): Promise<string | null> {
    try {
      const token = await this.registerForPushNotificationsAsync();

      if (token) {
        await this.saveTokenToDatabase(studentId, token);
      }

      return token;
    } catch (error) {
      console.error("Notification initialization failed:", error);
      return null;
    }
  },

  /**
   * Requests permissions and retrieves the push token
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn("Push notifications require a physical device");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Failed to get push token for push notification!");
      return null;
    }

    // Get the token (Native device token for FCM)
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token = deviceToken.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  },

  /**
   * Saves the token to Firestore for targeted push notifications
   */
  async saveTokenToDatabase(studentId: string, token: string): Promise<void> {
    try {
      await setDoc(
        doc(db, "fcm_tokens", studentId),
        {
          fcmToken: token,
          platform: Platform.OS,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      console.log("Device token synchronized with Firebase for:", studentId);
    } catch (err) {
      console.error("Error saving push token to database:", err);
    }
  },

  /**
   * Schedules a local notification immediately
   */
  async sendLocalNotification(title: string, body: string, data: any = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  },

  /**
   * Adds an internal notification record to the user's notification history
   * and optionally triggers a push notification via the backend.
   */
  async insertNotification<T extends NotificationType>(data: InsertNotificationParams<T>, triggerPush = true) {
    const id = await notificationRepo.addNotification({
      studentId: data.studentId,
      senderId: data.senderId,
      title: data.title,
      body: data.body,
      type: data.type,
      data: data.payload ?? null,
    });

    if (triggerPush) {
      this.sendPushToBackend({
        receiverId: data.studentId,
        title: data.title,
        body: data.body,
        type: data.type,
        data: data.payload
      }).catch(err => console.error("Trigger push failed:", err));
    }

    return id;
  },

  /**
   * Calls the Flask backend to send a real FCM push notification
   */
  async sendPushToBackend(payload: any) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sets up listeners for notification events
   * @returns Cleanup function to remove listeners
   */
  setupListeners(
    onReceived?: (notification: Notifications.Notification) => void,
    onResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        if (onReceived) onReceived(notification);
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response received:", response);
        if (onResponse) onResponse(response);
      }
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },

  listenToNewNotifications(studentId: string, onNewNotification?: (notif: any) => void) {
    const startTime = Date.now();
    const alreadyShown = new Set<string>();

    return notificationRepo.listenNotifications(studentId, (notifications) => {
      // Find notifications created after the app started/listener attached
      const newNotifs = notifications.filter(n => {
        if (!n.id || alreadyShown.has(n.id)) return false;

        // Nếu server chưa trả về timestamp, ta coi như nó vừa mới tạo (Date.now()) 
        // để tránh delay 1-2s đợi server sync.
        const createdTime = n.createdAt ? new Date(n.createdAt).getTime() : Date.now();

        return createdTime >= startTime && n.unreadCount > 0;
      });

      if (newNotifs.length > 0) {
        newNotifs.forEach(notif => {
          if (notif.id) alreadyShown.add(notif.id);

          // Trigger local notification if it's a social activity
          if (["comment", "post_reaction", "friend_request", "friend_accept"].includes(notif.type)) {
            this.sendLocalNotification(notif.title, notif.body, notif.data);
          }
          if (onNewNotification) onNewNotification(notif);
        });
      }
    });
  },

  /**
   * Schedules notifications for the next 3 days at 20:00 to remind about tomorrow's schedule.
   * This is called to ensure the user always knows their upcoming schedule.
   */
  async scheduleThreeDaysNotifications() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      // 1. Respect the user setting in SettingsScreen.tsx
      const isEnabled = await storageService.get({ key: STORAGE_KEYS.NOTIFICATION_ENABLE });
      if (isEnabled === false) {
        // If disabled, cancel all scheduled notifications and do not schedule new ones
        await Notifications.cancelAllScheduledNotificationsAsync();
        return;
      }

      const stored = await storageService.get({ key: STORAGE_KEYS.THREE_DAYS_SCHEDULES });
      if (!stored) return;

      const schedulesToRender: DaySchedule[] = JSON.parse(stored);
      const now = new Date();

      // Clear previously scheduled notifications to avoid duplicates and stale data
      await Notifications.cancelAllScheduledNotificationsAsync();

      for (let i = 0; i < 3; i++) {
        const triggerDate = new Date();
        triggerDate.setDate(now.getDate() + i);
        triggerDate.setHours(20, 0, 0, 0);

        // If the trigger time for "today" has already passed, skip it
        if (i === 0 && now.getTime() >= triggerDate.getTime()) {
          continue;
        }

        // We want to notify about the schedule for the day AFTER the trigger fires
        const targetDate = new Date(triggerDate);
        targetDate.setDate(targetDate.getDate() + 1);

        const daySchedule = schedulesToRender.find(schedule => {
          const scheduleDate = new Date(schedule.date);
          return isSameDay(scheduleDate, targetDate);
        });

        const hasLesson = (daySchedule?.lessons?.length ?? 0) > 0;
        const title = 'Thông báo lịch học';
        const body = hasLesson
          ? 'Bạn có lịch học vào ngày mai. Đừng quên nhé!'
          : 'Ngày mai bạn rảnh, không có lịch học đâu.';

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { screen: 'Home' },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            date: triggerDate.getTime(),
            type: 'date',
          } as any,
        });
      }
      // console.log("Successfully scheduled notifications for the next 3 days at 20:00");
    } catch (error) {
      console.error("Error in scheduleThreeDaysNotifications:", error);
    }
  }
};

/**
 * @deprecated Use NotificationService.initialize instead
 */
export const initPushNotifications = async (studentId: string, callback?: (token: string) => void) => {
  const token = await NotificationService.initialize(studentId);
  if (token && callback) callback(token);
};

/**
 * @deprecated Use NotificationService.insertNotification instead
 */
export const insertNotification = async <T extends NotificationType>(data: InsertNotificationParams<T>) => {
  return await NotificationService.insertNotification(data);
};