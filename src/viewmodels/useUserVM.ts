import { UserProfileModel } from 'models/user';
import { useEffect, useState } from 'react';
import { userRepo, UserPresence } from 'repositories/userRepo';

export const useUserVM = () => {
  const [profile, setProfile] = useState<UserProfileModel | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [presence, setPresence] = useState<UserPresence>({
    online: false,
    lastSeen: null,
  });
  const [error, setError] = useState('');

  const loadProfile = async (studentId: string) => {
    try {
      setError('');
      const data = await userRepo.getProfile(studentId);
      setProfile(data);
    } catch (e: any) {
      setError(e.message || 'Load profile failed');
    }
  };

  const loadCounts = async (studentId: string) => {
    try {
      setError('');
      const data = await userRepo.getFriendCounts(studentId);
      setFriendsCount(data.friends);
      setFollowersCount(data.followers);
    } catch (e: any) {
      setError(e.message || 'Load counts failed');
    }
  };

  const uploadAvatar = async (studentId: string, fileUri: string) => {
    try {
      setError('');
      const avatarUrl = await userRepo.uploadAvatar(studentId, fileUri);
      setProfile(prev => (prev ? { ...prev, avatar: avatarUrl } : prev));
    } catch (e: any) {
      setError(e.message || 'Upload avatar failed');
    }
  };

  const updateLastOnline = async (studentId: string) => {
    try {
      await userRepo.updateLastOnline(studentId);
    } catch { }
  };

  const listenUserPresence = (studentId: string) => {
    return userRepo.listenUserPresence(studentId, data => {
      setPresence(data);
    });
  };

  return {
    profile,
    friendsCount,
    followersCount,
    presence,
    error,
    loadProfile,
    loadCounts,
    uploadAvatar,
    updateLastOnline,
    listenUserPresence,
  };
};
