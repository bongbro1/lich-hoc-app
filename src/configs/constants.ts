export const SORT_OPTIONS = {
  top: 'Phù hợp nhất',
  newest: 'Mới nhất',
  all: 'Tất cả bình luận',
} as const;

export type SortMode = keyof typeof SORT_OPTIONS;

export const SCREENS = {
  // Main Tabs
  HOME: 'Home',
  DASHBOARD: 'Dashboard',
  CHATS: 'Chats',
  NOTIFICATIONS: 'Notifications',
  NOTIFICATION_DETAIL: 'NotificationDetailScreen',
  SETTINGS: 'Settings',
  SETTINGS_MAIN: 'SettingsMain',
  HELP_CENTER: 'HelpCenter',
  ABOUT: 'About',

  // Dashboard Stack
  DASHBOARD_MAIN: 'DashboardMain',
  SCHEDULE: 'ScheduleScreen',
  GRADES: 'GradesScreen',
  FRIENDS_NEARBY: 'FriendsNearbyScreen',
  FRIENDS: 'FriendsScreen',
  PROFILE_FEED: 'ProfileFeedScreen',
  EDIT_PROFILE_DETAILS: 'EditProfileDetailsScreen',
  CREATE_STORY: 'CreateStoryScreen',
  COMMENT: 'CommentScreen',
  WEATHER: 'WeatherScreen',

  // Chat Stack
  CHAT_TAB: 'ChatTab',
  CHAT_DETAIL: 'ChatDetailScreen',
  IMAGE_PICKER: 'ImagePickerScreen',
  CREATE_NOTE: 'CreateNoteScreen',

  // Root Stack
  LOGIN: 'Login',
  MAIN_APP: 'MainApp',
} as const;