import { NavigatorScreenParams } from "@react-navigation/native";
import { Friend_Near } from "../types/typesChat";
import { UserModel } from "models/user";
import { ChatParticipant } from "types/chat.types";

// Stack Chat
export type ChatStackParamList = {
  ChatTab: undefined;
  ChatDetailScreen: {
    user: ChatParticipant;
    conversationId?: string;
    selectedImages?: string[];
    __from?: string;
  };
  ImagePickerScreen: undefined;
  CreateNoteScreen: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Chats: NavigatorScreenParams<ChatStackParamList>;
  Notifications: NavigatorScreenParams<NotificationStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  HelpCenter: undefined;
  About: undefined;
};

export type NotificationStackParamList = {
  NotificationsMain: undefined;
  NotificationDetailScreen: {
    notification: import('../models/notification').NotificationModel;
  };
  PostDetailScreen: {
    postId: string;
    focusComment?: boolean;
  };
};

// Stack root
export type RootStackParamList = {
  Login: undefined;
  MainApp: undefined;
  Call: NavigatorScreenParams<CallStackParamList>;
};

// tab call
export type CallStackParamList = {
  OutgoingCall: {
    callId: string;
    partnerUser: any;
    callType: 'audio' | 'video';
    conversationId?: string | null;
    returnTo: {
      name: string;
      params?: any;
    };
  };
  IncomingCall: {
    callId: string;
    callerId: string;
    calleeId: string;
    callType: 'audio' | 'video';
    conversationId?: string | null;
    __from?: string;
  };
  InCall: {
    callId: string;
    partnerUser: any;
    callType: 'audio' | 'video';
    conversationId?: string | null;
  };
};


export type DashboardStackParamList = {
  DashboardMain: undefined;
  ScheduleScreen: undefined;
  GradesScreen: undefined;
  NotificationsScreen: undefined;
  FriendsNearbyScreen: undefined;
  FriendsScreen: undefined;
  ProfileFeedScreen: {
    studentId: string;
  };
  CreateStoryScreen: undefined;
  EditProfileDetailsScreen: {
    studentId: string;
    initialProfile?: any;
  };
  CommentScreen: {
    postId?: string;
    replyTarget?: any;
  } | undefined;
  WeatherScreen: undefined;
};
