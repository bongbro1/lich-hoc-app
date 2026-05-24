export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface FriendshipModel {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
}
export interface FriendItemModel {
  studentId: string;
  name: string;
  avatar?: string | null;
  major?: string;
  status?: FriendshipStatus;
  isOnline?: boolean;
}