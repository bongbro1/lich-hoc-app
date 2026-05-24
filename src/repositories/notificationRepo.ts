import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from 'configs/firebase';
import { NotificationModel, NotificationType } from 'models/notification';

const NOTIFICATIONS = 'notifications';

export const notificationRepo = {
  async addNotification(params: {
    studentId: string;
    senderId?: string;
    title: string;
    body: string;
    type?: NotificationType;
    data?: Record<string, any> | null;
  }) {
    const {
      studentId,
      senderId,
      title,
      body,
      type = 'system',
      data = null,
    } = params;

    const notiRef = collection(db, NOTIFICATIONS, studentId, 'items');

    const docRef = await addDoc(notiRef, {
      studentId,
      senderId,
      title,
      body,
      type,
      data,
      unreadCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async markAsRead(studentId: string, notificationId: string) {
    await updateDoc(doc(db, NOTIFICATIONS, studentId, 'items', notificationId), {
      unreadCount: 0,
      updatedAt: serverTimestamp(),
    });
  },

  async markFriendRequestAsRead(studentId: string, requestId: string) {
    try {
      const snap = await getDocs(
        query(
          collection(db, NOTIFICATIONS, studentId, 'items'),
          where('type', '==', 'friend_request'),
          where('data.requestId', '==', requestId),
          limit(1)
        )
      );

      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          unreadCount: 0,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('markFriendRequestAsRead error:', error);
    }
  },

  async markAllAsRead(studentId: string) {
    const snap = await getDocs(
      query(
        collection(db, NOTIFICATIONS, studentId, 'items'),
        where('unreadCount', '>', 0),
        limit(100)
      )
    );

    await Promise.all(
      snap.docs.map((item) =>
        updateDoc(item.ref, {
          unreadCount: 0,
          updatedAt: serverTimestamp(),
        })
      )
    );
  },

  listenNotifications(
    studentId: string,
    callback: (items: NotificationModel[]) => void
  ) {
    return onSnapshot(
      query(
        collection(db, NOTIFICATIONS, studentId, 'items'),
        orderBy('createdAt', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        const result: NotificationModel[] = snapshot.docs
          .map((item) => {
            const d = item.data();
            return {
              id: item.id,
              studentId: d.studentId,
              title: d.title ?? '',
              body: d.body ?? '',
              type: d.type ?? 'system',
              data: d.data ?? null,
              unreadCount: Number(d.unreadCount ?? 0),
              createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? null,
              updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() ?? null,
            };
          })
          // giữ logic cũ: friend_request chỉ hiện khi unreadCount > 0
          .filter((n) => {
            if (n.type === 'friend_request') {
              return n.unreadCount > 0;
            }
            return true;
          });
        callback(result);
      }
    );
  },

  listenUnreadCount(
    studentId: string,
    callback: (count: number) => void
  ) {
    return onSnapshot(
      query(
        collection(db, NOTIFICATIONS, studentId, 'items'),
        where('unreadCount', '>', 0),
        limit(50)
      ),
      (snapshot) => {
        const count = snapshot.docs.reduce((sum, item) => {
          const data = item.data();
          return sum + Number(data.unreadCount ?? 0);
        }, 0);

        callback(count);
      }
    );
  },
};