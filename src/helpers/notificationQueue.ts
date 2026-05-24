let pendingNotificationData: any = null;

export function setPendingNotification(data: any) {
  pendingNotificationData = data;
}

export function consumePendingNotification() {
  const data = pendingNotificationData;
  pendingNotificationData = null;
  return data;
}