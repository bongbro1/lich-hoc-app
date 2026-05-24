export type NotificationPayloadMap = {
  comment: {
    postId: string;
    commentId: string;
  };

  share: {
    postId: string;
  };

  post_reaction: {
    postId: string;
  };

  comment_reaction: {
    postId: string;
    commentId: string;
  };

  system: {};

  friend_accept: {
    userId: string;
  };

  friend_request: {
    userId: string;
    requestId: string;
  };

  follow: {
    userId: string;
  };
};

export type NotificationType = keyof NotificationPayloadMap;

// model chính dùng trong app logic
export type Notification<T extends NotificationType = NotificationType> = {
  id?: string;

  studentId: string;
  senderId?: string;

  type: T;
  title: string;
  body: string;

  payload: NotificationPayloadMap[T];

  isRead: boolean;
  createdAt: number;
};

// input khi insert
export type InsertNotificationParams<T extends NotificationType> = {
  studentId: string;
  senderId?: string;

  type: T;
  title: string;
  body: string;

  payload: NotificationPayloadMap[T];
};

// model đọc từ Firestore
export type NotificationModel<T extends NotificationType = NotificationType> = {
  id: string;
  studentId: string;
  senderId?: string;

  title: string;
  body: string;
  type: T;

  data?: NotificationPayloadMap[T] | null;

  unreadCount: number;
  createdAt: string | null;
  updatedAt?: string | null;
};

// model item hiển thị list
export interface NotificationItemModel {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
}

// nếu bạn vẫn cần model riêng cho push/local app notification
export type AppNotification = {
  id: number;
  title: string;
  body: string;
  data: {
    screen: string;
    studentId?: string;
    avatar?: string | null;
    name?: string;
    mutualFriendsCount?: number;
  } | null;

  type: NotificationType | string;
  unreadCount: number;
  createdAt: string;
};