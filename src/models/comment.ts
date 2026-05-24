import { ReactionType, UserPreviewModel } from './post';


export interface CommentReactionModel {
  user: UserPreviewModel;
  type: ReactionType;
}

// export interface CommentModel {
//   id: string;
//   postId: string;
//   content: string;
//   timestamp: string;
//   parentCommentId?: string | null;
// }


export interface CommentModel {
  id: string;
  postId: string;
  user: UserPreviewModel;
  content: string;
  timestamp: string;

  parentCommentId?: string | null;
  replies: CommentModel[];
  reactions: CommentReactionModel[];
}

export type CommentItemProps = {
  comment: CommentModel;
  level?: number;
  onReact?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
};