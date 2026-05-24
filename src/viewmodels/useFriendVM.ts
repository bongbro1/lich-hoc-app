import { useState, useCallback } from 'react';
import { friendRepo } from 'repositories/friendRepo';
import { notificationRepo } from 'repositories/notificationRepo';
import {
  FriendRelationModel,
  FriendRequestModel,
} from 'models/friend';
import { useLoading } from 'contexts/LoadingContext';
import { insertNotification } from 'services/notificationService';

export const useFriendVM = () => {
  const [relation, setRelation] = useState<FriendRelationModel>({
    status: 'unknown',
  });

  const [incomingRequests, setIncomingRequests] = useState<FriendRequestModel[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const { showLoading, hideLoading } = useLoading();

  const sendFriendRequest = async (
    me: string,
    target: string,
    meName?: string
  ) => {
    try {
      showLoading();
      setError('');

      const requestId = await friendRepo.sendFriendRequest(me, target);

      if (me !== target) {
        await insertNotification({
          studentId: target,
          senderId: me,
          type: 'friend_request',
          title: 'Lời mời kết bạn',
          body: meName
            ? `${meName} đã gửi cho bạn lời mời kết bạn`
            : 'Bạn có một lời mời kết bạn mới',
          payload: {
            userId: me,
            requestId,
          },
        });
      }
    } catch (e: any) {
      setError(e.message || 'Send friend request failed');
    } finally {
      hideLoading();
    }
  };

  const accept = async (
    requestId: string,
    from: string,
    to: string,
    accepterName?: string
  ) => {
    try {
      showLoading();
      setError('');
      await friendRepo.acceptFriendRequest(requestId, from, to);

      if (from !== to) {
        await insertNotification({
          studentId: from,
          senderId: to,
          type: 'friend_accept',
          title: 'Chấp nhận kết bạn',
          body: accepterName
            ? `${accepterName} đã chấp nhận lời mời kết bạn của bạn`
            : 'Lời mời kết bạn của bạn đã được chấp nhận',
          payload: {
            userId: to,
          },
        });
      }
    } catch (e: any) {
      setError(e.message || 'Accept friend request failed');
    } finally {
      hideLoading();
    }
  };

  const reject = async (requestId: string, from?: string, to?: string) => {
    try {
      showLoading();
      setError('');

      await friendRepo.rejectFriendRequest(requestId);

      if (from && to) {
        await friendRepo.unfollow(from, to);
      }
    } catch (e: any) {
      setError(e.message || 'Reject friend request failed');
    } finally {
      hideLoading();
    }
  };

  const cancel = async (requestId: string, me?: string, target?: string) => {
    try {
      showLoading();
      setError('');

      await friendRepo.cancelFriendRequest(requestId);

      if (me && target) {
        await friendRepo.unfollow(me, target);
      }
    } catch (e: any) {
      setError(e.message || 'Cancel friend request failed');
    } finally {
      hideLoading();
    }
  };

  const unfriend = useCallback(async (me: string, target: string) => {
    try {
      showLoading();
      setError('');
      await friendRepo.unfriend(me, target);
    } catch (e: any) {
      setError(e.message || 'Unfriend failed');
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const follow = useCallback(async (
    me: string,
    target: string,
    meName?: string
  ) => {
    try {
      showLoading();
      setError('');
      await friendRepo.follow(me, target);

      if (me !== target) {
        await insertNotification({
          studentId: target,
          senderId: me,
          type: 'follow',
          title: 'Người theo dõi mới',
          body: meName
            ? `${meName} đã theo dõi bạn`
            : 'Bạn có một người theo dõi mới',
          payload: {
            userId: me,
          },
        });
      }
    } catch (e: any) {
      setError(e.message || 'Follow failed');
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const unfollow = useCallback(async (me: string, target: string) => {
    try {
      showLoading();
      setError('');
      await friendRepo.unfollow(me, target);
    } catch (e: any) {
      setError(e.message || 'Unfollow failed');
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const listenRelation = useCallback((me: string, target: string) => {
    return friendRepo.listenRelation(me, target, (newRel) => {
      console.log('DEBUG [useFriendVM]: relation updated =>', newRel);
      setRelation(newRel);
    });
  }, []);

  const listenRequests = useCallback((me: string) => {
    return friendRepo.listenIncomingRequests(me, setIncomingRequests);
  }, []);

  const listenFriends = useCallback((me: string) => {
    return friendRepo.listenFriends(me, setFriendIds);
  }, []);

  const listenFollowers = useCallback((me: string) => {
    return friendRepo.listenFollowers(me, setFollowerIds);
  }, []);

  const listenFollowing = useCallback((me: string) => {
    return friendRepo.listenFollowing(me, setFollowingIds);
  }, []);

  const listenBlocked = useCallback((me: string) => {
    return friendRepo.listenBlocked(me, setBlockedIds);
  }, []);

  const blockUser = useCallback(async (me: string, target: string) => {
    try {
      showLoading();
      setError('');
      await friendRepo.blockUser(me, target);
    } catch (e: any) {
      setError(e.message || 'Block user failed');
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const unblockUser = useCallback(async (me: string, target: string) => {
    try {
      showLoading();
      setError('');
      await friendRepo.unblockUser(me, target);
    } catch (e: any) {
      setError(e.message || 'Unblock user failed');
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const fetchRelation = useCallback(async (me: string, target: string) => {
    try {
      setError('');
      const rel = await friendRepo.getRelation(me, target);
      setRelation(rel);
      return rel;
    } catch (e: any) {
      setError(e.message || 'Fetch relation failed');
    }
  }, []);

  return {
    relation,
    incomingRequests,
    friendIds,
    followerIds,
    followingIds,
    blockedIds,
    friendsCount: friendIds.length,
    followersCount: followerIds.length,
    followingCount: followingIds.length,
    error,
    sendFriendRequest,
    accept,
    reject,
    cancel,
    unfriend,
    follow,
    unfollow,
    blockUser,
    unblockUser,
    fetchRelation,
    listenRelation,
    listenRequests,
    listenFriends,
    listenFollowers,
    listenFollowing,
    listenBlocked,
  };
};
