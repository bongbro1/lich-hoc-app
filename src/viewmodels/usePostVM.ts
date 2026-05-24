import { CommentModel } from 'models/comment';
import {
  PostModel,
  ReactionActionType,
  ReactionSummaryModel,
  ReactionType,
  UploadImageModel,
  UserPreviewModel,
} from 'models/post';
import { useCallback, useEffect, useState } from 'react';
import { postRepo } from 'repositories/postRepo';
import { insertNotification } from 'services/notificationService';

type CreatePostInput = {
  userId: string;
  studentName: string;
  avatarUri?: string | null;
  content?: string;
  images?: UploadImageModel[];
};

export const usePostVM = (studentId?: string) => {
  const [posts, setPosts] = useState<PostModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subscribePostReactionSummary = useCallback(
    (postId: string, callback: (summary: ReactionSummaryModel) => void) => {
      return postRepo.subscribePostReactionSummary(postId, callback);
    },
    []
  );

  const subscribeMyReaction = useCallback(
    (
      postId: string,
      currentStudentId: string,
      callback: (reactionType: ReactionType | null) => void
    ) => {
      return postRepo.subscribeMyReaction(postId, currentStudentId, callback);
    },
    []
  );

  const subscribeComments = useCallback(
    (postId: string, callback: (comments: CommentModel[]) => void) => {
      return postRepo.subscribeComments(postId, callback);
    },
    []
  );

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await postRepo.getPosts(studentId);
      setPosts(data);
      return data;
    } catch (e: any) {
      const message = e.message || 'Load posts failed';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    setLoading(true);
    setError('');

    const unsubscribe = postRepo.subscribePosts(
      (data) => {
        setPosts(data);
        setLoading(false);
      },
      studentId
    );

    return unsubscribe;
  }, [studentId]);

  const createPost = useCallback(async (input: CreatePostInput) => {
    try {
      setSubmitting(true);
      setError('');

      const user: UserPreviewModel = {
        studentId: input.userId,
        name: input.studentName,
        avatar: input.avatarUri ?? null,
      };

      const post = await postRepo.createPost({
        userId: input.userId,
        user,
        content: input.content,
        images: input.images,
      });

      return {
        success: true,
        post,
      };
    } catch (e: any) {
      const message = e.message || 'Create post failed';
      setError(message);
      return {
        success: false,
        error: message,
      };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      setSubmitting(true);
      setError('');
      await postRepo.deletePost(postId);

      return { success: true };
    } catch (e: any) {
      const message = e.message || 'Delete post failed';
      setError(message);
      return {
        success: false,
        error: message,
      };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reactPost = useCallback(
    async (
      postId: string,
      receiverId: string,
      user: UserPreviewModel,
      type: ReactionActionType
    ) => {
      try {
        setError("");

        const summary = await postRepo.reactPost({
          postId,
          user,
          type,
        });

        if (type !== "unreact" && receiverId !== user.studentId) {
          await insertNotification({
            studentId: receiverId,
            senderId: user.studentId,
            type: "post_reaction",
            title: "Hoạt động",
            body: `${user.name} đã thích bài viết của bạn`,
            payload: {
              postId,
            },
          });
        }

        return {
          success: true,
          summary,
        };
      } catch (e: any) {
        const message = e.message || "React post failed";
        setError(message);
        return {
          success: false,
          error: message,
        };
      }
    },
    []
  );

  const loadComments = useCallback(async (postId: string) => {
    try {
      setError('');
      return await postRepo.getComments(postId);
    } catch (e: any) {
      const message = e.message || 'Load comments failed';
      setError(message);
      return [];
    }
  }, []);

  const addComment = useCallback(
    async (
      postId: string,
      postOwnerId: string,
      user: UserPreviewModel,
      content: string,
      parentCommentId?: string | null,
      parentCommentOwnerId?: string
    ) => {
      try {
        setSubmitting(true);
        setError("");

        const commentId = await postRepo.addComment({
          postId,
          user,
          content,
          parentCommentId,
        });

        const receiverId = parentCommentId
          ? parentCommentOwnerId
          : postOwnerId;

        if (receiverId && receiverId !== user.studentId) {
          await insertNotification({
            studentId: receiverId,
            senderId: user.studentId,
            type: "comment",
            title: "Bình luận mới",
            body: `${user.name} đã bình luận bài viết của bạn`,
            payload: {
              postId,
              commentId,
            },
          });
        }

        return {
          success: true,
          commentId,
        };
      } catch (e: any) {
        const message = e.message || "Add comment failed";
        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    try {
      setSubmitting(true);
      setError('');
      await postRepo.deleteComment(postId, commentId);

      return { success: true };
    } catch (e: any) {
      const message = e.message || 'Delete comment failed';
      setError(message);
      return {
        success: false,
        error: message,
      };
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    posts,
    loading,
    submitting,
    error,
    loadPosts,
    createPost,
    deletePost,
    reactPost,
    loadComments,
    addComment,
    deleteComment,
    subscribePostReactionSummary,
    subscribeMyReaction,
    subscribeComments,
    setPosts,
  };
};