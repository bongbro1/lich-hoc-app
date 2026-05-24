export interface PostImageModel {
  id: string;
  postId: string;
  url: string;
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'unreact';

export interface PostReactionModel {
  id: string;
  postId: string;
  userId: string;
  type: ReactionType;
}

export interface PostUserModel {
  studentId: string;
  name: string | null;
  avatar?: string | null;
}

export interface PostImageModel {
  id: string;
  postId: string;
  url: string;
}


export interface PostCommentModel {
  // tùy backend của bạn
  id: string;
  userId: string;
  content: string;
  timestamp: string;
}

// export interface ReactionSummaryModel {
//   type: string;
//   count: number;
// }

export type ReactionActionType = ReactionType | 'unreact';

export interface UserPreviewModel {
  studentId: string;
  name: string;
  avatar?: string | null;
}

export interface PostImageModel {
  id: string;
  postId: string;
  url: string;
  path?: string;
}

export interface ReactionSummaryModel {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
  unreact: number;
  total: number;
}

export interface PostReactionModel {
  user: UserPreviewModel;
  type: ReactionType;
}

// export interface PostModel {
//   id: string;
//   userId: string;
//   user: UserPreviewModel;
//   content?: string | null;
//   timestamp: string;
//   images: PostImageModel[];
//   comments: CommentModel[];
//   reactions: PostReactionModel[];
//   reactionSummary: ReactionSummaryModel;
//   commentsCount: number;
//   reactionsCount: number;
// }

export interface UploadImageModel {
  uri: string;
  name: string;
  type: string;
}

export interface PostModel {
  id: string;
  userId: string;
  user: PostUserModel;

  content?: string | null;
  timestamp: string;

  images?: PostImageModel[];
  comments?: PostCommentModel[];
  reactions?: PostReactionModel[];
  reactionSummary: ReactionSummaryModel;

  commentsCount?: number;
  reactionsCount?: number;
}