import { useState } from 'react';
import { useLoading } from 'contexts/LoadingContext';
import { notificationRepo } from 'repositories/notificationRepo';
import { NotificationModel, NotificationType } from 'models/notification';

export const useNotificationVM = () => {
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const { showLoading, hideLoading } = useLoading();

  const addNotification = async (params: {
    studentId: string;
    title: string;
    body: string;
    type?: NotificationType;
    data?: Record<string, any> | null;
  }) => {
    try {
      showLoading();
      setError('');
      return await notificationRepo.addNotification(params);
    } catch (e: any) {
      setError(e.message || 'Create notification failed');
      return null;
    } finally {
      hideLoading();
    }
  };

  const markAsRead = async (studentId: string, notificationId: string) => {
    try {
      setError('');
      await notificationRepo.markAsRead(studentId, notificationId);
    } catch (e: any) {
      setError(e.message || 'Mark read failed');
    }
  };

  const markAllAsRead = async (studentId: string) => {
    try {
      setError('');
      await notificationRepo.markAllAsRead(studentId);
    } catch (e: any) {
      setError(e.message || 'Mark all read failed');
    }
  };

  const listenNotifications = (studentId: string) => {
    return notificationRepo.listenNotifications(studentId, (items) => {
      setNotifications(items);
    });
  };

  const listenUnreadCount = (studentId: string) => {
    return notificationRepo.listenUnreadCount(studentId, (count) => {
      setUnreadCount(count);
    });
  };

  return {
    notifications,
    unreadCount,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    listenNotifications,
    listenUnreadCount,
  };
};