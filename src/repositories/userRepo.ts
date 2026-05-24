import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { UserProfileModel } from 'models/user';
import { db } from 'configs/firebase';
import { Friend_Near } from 'types/typesChat';
import { imgbbService } from 'services/imgbbService';

export type UserPresence = {
  online: boolean;
  lastSeen?: string | null;
};

const toIsoString = (value: any) =>
  value?.toDate?.()?.toISOString?.() ?? null;

const toOnlineStatusText = (lastSeen?: string | null) => {
  if (!lastSeen) return 'Chua hoat dong';

  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Dang hoat dong';
  if (diffMinutes < 60) return `Hoat dong ${diffMinutes} phut truoc`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hoat dong ${diffHours} gio truoc`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hoat dong ${diffDays} ngay truoc`;
};

const isOnlineFromLastSeen = (lastSeen?: string | null) =>
  !!lastSeen && Date.now() - new Date(lastSeen).getTime() < 60 * 1000;

const mapUserProfile = (studentId: string, data: any): UserProfileModel => ({
  studentId: data.studentId ?? studentId,
  name: data.name ?? '',
  avatar: data.avatar ?? null,
  cover: data.cover ?? null,
  major: data.major ?? null,
  className: data.className ?? null,
  schoolName: data.schoolName ?? null,
  followers: Number(data.followers ?? 0),
  following: Number(data.following ?? 0),
  posts: Number(data.posts ?? 0),
  lat: typeof data.lat === 'number' ? data.lat : null,
  lng: typeof data.lng === 'number' ? data.lng : null,
});

const haversineInMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distanceInMeters: number) => {
  if (distanceInMeters >= 1000) {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  }

  return `${Math.round(distanceInMeters)}m`;
};

const uploadProfileImage = async (
  studentId: string,
  fileUri: string,
  type: 'avatar' | 'cover'
) => {
  const suffix = fileUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${type}_${studentId}_${Date.now()}.${suffix}`;
  const url = await imgbbService.uploadImage(fileUri, fileName);

  await updateDoc(doc(db, 'users', studentId), {
    [type]: url,
  });

  return url;
};

export const userRepo = {
  async getProfile(studentId: string): Promise<UserProfileModel> {
    const snap = await getDoc(doc(db, 'users', studentId));

    if (!snap.exists()) {
      throw new Error('User not found');
    }

    return mapUserProfile(studentId, snap.data());
  },

  async getUserById(studentId: string) {
    const snap = await getDoc(doc(db, 'users', studentId));

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();
    const lastSeen = toIsoString(data.lastOnline);

    return {
      ...mapUserProfile(studentId, data),
      lastOnline: lastSeen,
      online: isOnlineFromLastSeen(lastSeen),
      onlineStatus: toOnlineStatusText(lastSeen),
    };
  },

  async getUsersByIds(studentIds: string[]) {
    const uniqueIds = Array.from(new Set(studentIds.filter(Boolean)));

    if (uniqueIds.length === 0) {
      return [];
    }

    const docs = await Promise.all(
      uniqueIds.map((studentId) => getDoc(doc(db, 'users', studentId)))
    );

    return docs
      .filter((snapshot) => snapshot.exists())
      .map((snapshot) => {
        const data = snapshot.data();
        const lastSeen = toIsoString(data.lastOnline);

        return {
          ...mapUserProfile(snapshot.id, data),
          lastOnline: lastSeen,
          online: isOnlineFromLastSeen(lastSeen),
          onlineStatus: toOnlineStatusText(lastSeen),
        };
      });
  },

  async getNearbyUsers(params: {
    currentUserId: string;
    lat: number;
    lng: number;
    limit?: number;
  }): Promise<Friend_Near[]> {
    const { currentUserId, lat, lng, limit = 20 } = params;
    const snapshot = await getDocs(collection(db, 'users'));

    const nearbyUsers = snapshot.docs
      .filter((item) => item.id !== currentUserId)
      .map((item) => {
        const data = item.data();

        if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
          return null;
        }

        const distanceInMeters = haversineInMeters(lat, lng, data.lat, data.lng);
        const lastSeen = toIsoString(data.lastOnline);

        return {
          studentId: item.id,
          name: data.name ?? '',
          className: data.className ?? '',
          distance: formatDistance(distanceInMeters),
          distanceMeters: distanceInMeters,
          avatar: data.avatar ?? '',
          online: isOnlineFromLastSeen(lastSeen),
          onlineStatus: toOnlineStatusText(lastSeen),
        };
      })
      .filter(Boolean) as Array<Friend_Near & { distanceMeters: number }>;

    return nearbyUsers
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit)
      .map(({ distanceMeters: _distanceMeters, ...item }) => item);
  },

  async getFriendCounts(studentId: string): Promise<{
    friends: number;
    followers: number;
  }> {
    const snap = await getDoc(doc(db, 'users', studentId));

    if (!snap.exists()) {
      throw new Error('User not found');
    }

    const data = snap.data();

    return {
      friends: Number(data.following ?? 0),
      followers: Number(data.followers ?? 0),
    };
  },

  async uploadAvatar(studentId: string, fileUri: string): Promise<string> {
    return uploadProfileImage(studentId, fileUri, 'avatar');
  },

  async uploadCover(studentId: string, fileUri: string): Promise<string> {
    return uploadProfileImage(studentId, fileUri, 'cover');
  },

  async updateLastOnline(studentId: string) {
    await updateDoc(doc(db, 'users', studentId), {
      lastOnline: serverTimestamp(),
    });
  },

  async addUserIfNotExists(
    user: Omit<UserProfileModel, 'followers' | 'following' | 'posts'>
  ) {
    const userRef = doc(db, 'users', user.studentId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        studentId: user.studentId,
        name: user.name,
        className: user.className ?? null,
        schoolName: user.schoolName ?? null,
        major: user.major ?? null,
        avatar: user.avatar ?? null,
        cover: user.cover ?? null,
        lat: user.lat ?? null,
        lng: user.lng ?? null,
        followers: 0,
        following: 0,
        posts: 0,
        lastOnline: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    await setDoc(
      userRef,
      {
        name: user.name,
        className: user.className ?? null,
        schoolName: user.schoolName ?? null,
        major: user.major ?? null,
        avatar: user.avatar ?? null,
        cover: user.cover ?? null,
        lat: user.lat ?? null,
        lng: user.lng ?? null,
        lastOnline: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  listenUserPresence(
    studentId: string,
    callback: (presence: UserPresence) => void
  ) {
    const userRef = doc(db, 'users', studentId);

    const unsub = onSnapshot(userRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback({
          online: false,
          lastSeen: null,
        });
        return;
      }

      const data = snapshot.data();
      const lastSeen = toIsoString(data?.lastOnline);
      const online = isOnlineFromLastSeen(lastSeen);

      callback({
        online,
        lastSeen,
      });
    });

    return unsub;
  },

  listenUserById(studentId: string, callback: (user: any | null) => void) {
    return onSnapshot(doc(db, 'users', studentId), (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        studentId: snapshot.id,
        ...snapshot.data(),
      });
    });
  }
};
