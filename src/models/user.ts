export interface UserModel {
  studentId: string;
  name: string;
  className?: string;
  schoolName?: string;
  major?: string;
  avatar?: string | null;
  cover?: string | null;

  lastOnline?: string | null;
  lat?: number | null;
  lng?: number | null;
  fcmToken?: string | null;
}


export interface UserPresenceModel {
  studentId: string;
  lastOnline?: string | null;
  isOnline: boolean;
  onlineStatusText: string;
}

export interface UserProfileModel {
  studentId: string;
  name: string;
  avatar?: string | null;
  cover?: string | null;
  schoolName?: string | null;
  major?: string | null;
  className?: string | null;
  followers: number;
  following: number;
  posts: number;
  lat?: number | null;
  lng?: number | null;
}

export interface UploadAvatarResult {
  message: string;
  avatarUrl: string;
}

export interface UpdateLastOnlineResult {
  message: string;
}
