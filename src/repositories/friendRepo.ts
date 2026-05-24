import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { FriendRelationModel, FriendRequestModel } from 'models/friend';
import { db } from 'configs/firebase';

const FRIEND_REQUESTS = 'friend_requests';
const FRIENDS = 'friends';
const BLOCKS = 'blocks';
const FOLLOWS = 'follows';

const getFriendIds = async (studentId: string) => {
  const snapshot = await getDocs(collection(db, FRIENDS, studentId, 'user_friends'));
  return snapshot.docs.map((item) => item.id);
};

const isBlocked = async (blockerId: string, blockedId: string) => {
  const snapshot = await getDoc(
    doc(db, BLOCKS, blockerId, 'blocked_users', blockedId)
  );

  return snapshot.exists();
};

export const friendRepo = {
  async sendFriendRequest(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new Error('Khong the ket ban voi chinh minh');
    }

    const relation = await this.getRelation(currentUserId, targetUserId);

    if (relation.status === 'friends') {
      throw new Error('Da la ban be');
    }

    if (relation.status === 'pending_sent') {
      throw new Error('Da gui loi moi');
    }

    if (relation.status === 'pending_received') {
      throw new Error('Nguoi nay da gui loi moi cho ban');
    }

    if (relation.status === 'blocked_by_me' || relation.status === 'blocked_me') {
      throw new Error('Khong the gui loi moi do quan he chan');
    }

    const ref = await addDoc(collection(db, FRIEND_REQUESTS), {
      fromStudentId: currentUserId,
      toStudentId: targetUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  },

  async acceptFriendRequest(
    requestId: string,
    fromStudentId: string,
    toStudentId: string
  ) {
    await updateDoc(doc(db, FRIEND_REQUESTS, requestId), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    await Promise.all([
      setDoc(doc(db, FRIENDS, fromStudentId, 'user_friends', toStudentId), {
        friendId: toStudentId,
        createdAt: serverTimestamp(),
      }),
      setDoc(doc(db, FRIENDS, toStudentId, 'user_friends', fromStudentId), {
        friendId: fromStudentId,
        createdAt: serverTimestamp(),
      }),
    ]);
  },

  async rejectFriendRequest(requestId: string) {
    await updateDoc(doc(db, FRIEND_REQUESTS, requestId), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
  },

  async cancelFriendRequest(requestId: string) {
    await updateDoc(doc(db, FRIEND_REQUESTS, requestId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  },

  async unfriend(currentUserId: string, targetUserId: string) {
    await Promise.all([
      deleteDoc(doc(db, FRIENDS, currentUserId, 'user_friends', targetUserId)),
      deleteDoc(doc(db, FRIENDS, targetUserId, 'user_friends', currentUserId)),
    ]);
  },

  async blockUser(blockerId: string, blockedId: string) {
    await setDoc(doc(db, BLOCKS, blockerId, 'blocked_users', blockedId), {
      blockedId,
      createdAt: serverTimestamp(),
    });

    await Promise.all([
      this.unfriend(blockerId, blockedId),
      this.unfollow(blockerId, blockedId),
      this.unfollow(blockedId, blockerId),
    ]);
  },

  async unblockUser(blockerId: string, blockedId: string) {
    await deleteDoc(doc(db, BLOCKS, blockerId, 'blocked_users', blockedId));
  },

  async follow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new Error('Khong the theo doi chinh minh');
    }

    await Promise.all([
      setDoc(doc(db, FOLLOWS, targetUserId, 'user_followers', currentUserId), {
        followerId: currentUserId,
        createdAt: serverTimestamp(),
      }),
      setDoc(doc(db, FOLLOWS, currentUserId, 'user_following', targetUserId), {
        followingId: targetUserId,
        createdAt: serverTimestamp(),
      }),
    ]);
  },

  async unfollow(currentUserId: string, targetUserId: string) {
    await Promise.all([
      deleteDoc(doc(db, FOLLOWS, targetUserId, 'user_followers', currentUserId)),
      deleteDoc(doc(db, FOLLOWS, currentUserId, 'user_following', targetUserId)),
    ]);
  },

  async getRelation(
    currentUserId: string,
    targetUserId: string
  ): Promise<FriendRelationModel> {
    const [blockedByMe, blockedMe] = await Promise.all([
      isBlocked(currentUserId, targetUserId),
      isBlocked(targetUserId, currentUserId),
    ]);

    if (blockedByMe) {
      return { status: 'blocked_by_me' };
    }

    if (blockedMe) {
      return { status: 'blocked_me' };
    }

    const friendSnap = await getDocs(
      query(
        collection(db, FRIENDS, currentUserId, 'user_friends'),
        where('friendId', '==', targetUserId),
        limit(1)
      )
    );

    if (!friendSnap.empty) {
      return { status: 'friends' };
    }

    const sentSnap = await getDocs(
      query(
        collection(db, FRIEND_REQUESTS),
        where('fromStudentId', '==', currentUserId),
        where('toStudentId', '==', targetUserId),
        where('status', '==', 'pending'),
        limit(1)
      )
    );

    if (!sentSnap.empty) {
      return {
        status: 'pending_sent',
        requestId: sentSnap.docs[0].id,
      };
    }

    const receivedSnap = await getDocs(
      query(
        collection(db, FRIEND_REQUESTS),
        where('fromStudentId', '==', targetUserId),
        where('toStudentId', '==', currentUserId),
        where('status', '==', 'pending'),
        limit(1)
      )
    );

    if (!receivedSnap.empty) {
      return {
        status: 'pending_received',
        requestId: receivedSnap.docs[0].id,
      };
    }

    return { status: 'none' };
  },

  listenRelation(
    currentUserId: string,
    targetUserId: string,
    callback: (data: FriendRelationModel) => void
  ) {
    const syncRelation = async () => {
      const relation = await this.getRelation(currentUserId, targetUserId);
      callback(relation);
    };

    void syncRelation();

    const unsubscribers = [
      onSnapshot(
        query(
          collection(db, FRIEND_REQUESTS),
          where('fromStudentId', 'in', [currentUserId, targetUserId])
        ),
        () => {
          void syncRelation();
        }
      ),
      onSnapshot(
        query(
          collection(db, FRIEND_REQUESTS),
          where('toStudentId', 'in', [currentUserId, targetUserId])
        ),
        () => {
          void syncRelation();
        }
      ),
      onSnapshot(collection(db, FRIENDS, currentUserId, 'user_friends'), () => {
        void syncRelation();
      }),
      onSnapshot(collection(db, BLOCKS, currentUserId, 'blocked_users'), () => {
        void syncRelation();
      }),
      onSnapshot(collection(db, BLOCKS, targetUserId, 'blocked_users'), () => {
        void syncRelation();
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  },

  listenIncomingRequests(
    currentUserId: string,
    callback: (data: FriendRequestModel[]) => void
  ) {
    return onSnapshot(
      query(
        collection(db, FRIEND_REQUESTS),
        where('toStudentId', '==', currentUserId),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        const result: FriendRequestModel[] = snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            fromStudentId: data.fromStudentId,
            toStudentId: data.toStudentId,
            status: data.status,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
          };
        });

        callback(result);
      }
    );
  },

  listenFriends(
    currentUserId: string,
    callback: (ids: string[]) => void
  ) {
    return onSnapshot(
      collection(db, FRIENDS, currentUserId, 'user_friends'),
      (snapshot) => {
        callback(snapshot.docs.map((item) => item.id));
      }
    );
  },

  listenFollowers(
    currentUserId: string,
    callback: (ids: string[]) => void
  ) {
    return onSnapshot(
      collection(db, FOLLOWS, currentUserId, 'user_followers'),
      (snapshot) => {
        callback(snapshot.docs.map((item) => item.id));
      }
    );
  },

  listenFollowing(
    currentUserId: string,
    callback: (ids: string[]) => void
  ) {
    return onSnapshot(
      collection(db, FOLLOWS, currentUserId, 'user_following'),
      (snapshot) => {
        callback(snapshot.docs.map((item) => item.id));
      }
    );
  },

  listenBlocked(
    currentUserId: string,
    callback: (ids: string[]) => void
  ) {
    return onSnapshot(
      collection(db, BLOCKS, currentUserId, 'blocked_users'),
      (snapshot) => {
        callback(snapshot.docs.map((item) => item.id));
      }
    );
  },

  async getMutualFriendCount(currentUserId: string, targetUserId: string, currentFriendIds?: string[]) {
    const [myFriendIds, targetFriendIds] = await Promise.all([
      currentFriendIds ?? getFriendIds(currentUserId),
      getFriendIds(targetUserId),
    ]);

    const currentSet = new Set(myFriendIds);
    return targetFriendIds.filter((id) => currentSet.has(id)).length;
  },
};
