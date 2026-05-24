export type FriendRequestDocStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled';

export type FriendRelationStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'friends'
  | 'blocked_by_me'
  | 'blocked_me'
  | 'unknown';

export type FriendRelationModel = {
  status: FriendRelationStatus;
  requestId?: string | null;
};

export type FriendRequestModel = {
  id: string;
  fromStudentId: string;
  toStudentId: string;
  status: FriendRequestDocStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FriendUserItem = {
  studentId: string;
  name: string;
  avatar?: string | null;
  major?: string | null;
  className?: string | null;
  mutualCount?: number;
  online?: boolean;
};


// export type Friend = {
//   friendshipId: number;
//   studentId: string;
//   name: string;
//   major: string;
//   className: string;
//   avatar?: string;
//   online: boolean;
//   mutualCount: number;
// };

// export type FriendStatus =
//   | "none"
//   | "pending"
//   | "requested"
//   | "accepted"
//   | "blocked";
type RelationStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'friends'
  | 'blocked_by_me'
  | 'blocked_me'
  | 'unknown';
export const FRIEND_UI: Record<
  RelationStatus,
  {
    icon: string;
    bgColor: string;
    iconColor: string;
    label: string;
    action: 'add' | 'accept' | 'reject' | 'cancel' | 'none';
  }
> = {
  none: {
    icon: "person-add",
    bgColor: "#007AFF",
    iconColor: "#fff",
    label: "Kết bạn",
    action: "add",
  },

  pending_sent: {
    icon: "person-remove",
    bgColor: "#868686ff",
    iconColor: "#fff",
    label: "Hủy yêu cầu",
    action: "cancel",
  },

  pending_received: {
    icon: "person-add-alt",
    bgColor: "#34C759",
    iconColor: "#fff",
    label: "Chấp nhận",
    action: "accept",
  },

  friends: {
    icon: "people",
    bgColor: "#eee",
    iconColor: "#333",
    label: "Bạn bè",
    action: "none",
  },

  blocked_by_me: {
    icon: "block",
    bgColor: "#FF3B30",
    iconColor: "#fff",
    label: "Đã chặn",
    action: "none",
  },

  blocked_me: {
    icon: "block",
    bgColor: "#FF3B30",
    iconColor: "#fff",
    label: "Bị chặn",
    action: "none",
  },

  unknown: {
    icon: "more-horiz",
    bgColor: "rgba(0,0,0,0.05)",
    iconColor: "rgba(0,0,0,0.3)",
    label: "",
    action: "none",
  },
};