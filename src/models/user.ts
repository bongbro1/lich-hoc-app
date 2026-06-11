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
  isOnline: boolean;
  onlineStatusText: string;

  work?: string | null;
  education?: string[] | null;
  currentCity?: string | null;
  hometown?: string | null;
  relationship?: string | null;
  socialLink?: string | null;
  showFollowers?: boolean | null;
  stories?: any[];
  note?: string | null;
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
  work?: string | null;
  education?: string[] | null;
  currentCity?: string | null;
  hometown?: string | null;
  relationship?: string | null;
  socialLink?: string | null;
  showFollowers?: boolean | null;
  stories?: any[];
  note?: string | null;
}

export interface UploadAvatarResult {
  message: string;
  avatarUrl: string;
}

export interface UpdateLastOnlineResult {
  message: string;
}
