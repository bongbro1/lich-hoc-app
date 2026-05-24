import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import {
  get,
  onValue,
  push,
  ref as rtdbRef,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database';

import {
  PostImageModel,
  PostModel,
  ReactionActionType,
  ReactionSummaryModel,
  ReactionType,
  UploadImageModel,
  UserPreviewModel,
} from 'models/post';
import { db, rtdb, storage } from 'configs/firebase';
import { CommentModel } from 'models/comment';

const POSTS_COLLECTION = 'posts';

const emptyReactionSummary = (): ReactionSummaryModel => ({
  like: 0,
  love: 0,
  haha: 0,
  wow: 0,
  sad: 0,
  angry: 0,
  unreact: 0,
  total: 0,
});

const toIsoString = (value: any) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  return new Date().toISOString();
};

const uploadImageAsync = async (
  postId: string,
  image: UploadImageModel,
  index: number
): Promise<PostImageModel> => {
  const isRemoteUrl = (uri: string) => /^https?:\/\//i.test(uri);
  const imageId = `${Date.now()}_${index}`;

  if (isRemoteUrl(image.uri)) {
    return {
      id: imageId,
      postId,
      url: image.uri,
      path: '', // No storage path for remote URLs
    };
  }

  const response = await fetch(image.uri);
  const blob = await response.blob();

  const path = `posts/${postId}/${imageId}_${image.name}`;
  const fileRef = storageRef(storage, path);

  await uploadBytes(fileRef, blob, {
    contentType: image.type,
  });

  const url = await getDownloadURL(fileRef);

  return {
    id: imageId,
    postId,
    url,
    path,
  };
};

const buildCommentTree = (comments: CommentModel[]) => {
  const map = new Map<string, CommentModel>();

  comments.forEach((comment) => {
    map.set(comment.id, {
      ...comment,
      replies: comment.replies ?? [],
    });
  });

  const roots: CommentModel[] = [];

  map.forEach((comment) => {
    if (comment.parentCommentId) {
      const parent = map.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(comment);
      } else {
        roots.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  const sortRecursive = (items: CommentModel[]) => {
    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    items.forEach((item) => {
      if (item.replies?.length) {
        sortRecursive(item.replies);
      }
    });
  };

  sortRecursive(roots);

  return roots;
};

const mapPostDocToModel = (id: string, data: any): PostModel => ({
  id,
  userId: data.userId,
  user: data.user,
  content: data.content ?? '',
  timestamp: toIsoString(data.timestamp),
  images: data.images ?? [],
  comments: [],
  reactions: [],
  reactionSummary: data.reactionSummary ?? emptyReactionSummary(),
  commentsCount: data.commentsCount ?? 0,
  reactionsCount: data.reactionsCount ?? 0,
});

const getAllDescendantCommentIds = (
  commentsMap: Record<string, any>,
  parentId: string
): string[] => {
  const directChildren = Object.entries(commentsMap)
    .filter(([, item]) => item?.parentCommentId?.toString() === parentId)
    .map(([id]) => id);

  return directChildren.flatMap((childId) => [
    childId,
    ...getAllDescendantCommentIds(commentsMap, childId),
  ]);
};

class PostRepo {
  async getPosts(studentId?: string): Promise<PostModel[]> {
    const postsRef = collection(db, POSTS_COLLECTION);

    const q = studentId
      ? query(
          postsRef,
          where('userId', '==', studentId),
          orderBy('timestamp', 'desc')
        )
      : query(postsRef, orderBy('timestamp', 'desc'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => mapPostDocToModel(item.id, item.data()));
  }

  async createPost(params: {
    userId: string;
    user: UserPreviewModel;
    content?: string;
    images?: UploadImageModel[];
  }): Promise<PostModel> {
    // 1. Upload images first to ensure everything is ready
    const uploadedImages = await Promise.all(
      (params.images ?? []).map((image, index) =>
        uploadImageAsync('temp_id', image, index) // Note: temp_id since we don't have postRef.id yet
      )
    );

    // 2. Create the post document with all data at once
    const postRef = await addDoc(collection(db, POSTS_COLLECTION), {
      userId: params.userId,
      user: params.user,
      content: params.content ?? '',
      images: uploadedImages,
      timestamp: serverTimestamp(),
      reactionSummary: emptyReactionSummary(),
      commentsCount: 0,
      reactionsCount: 0,
    });

    // 3. Update the image paths now that we have the real post ID
    // (Optional: if you want the path to contain the real post ID, 
    // but since we are moving towards remote URLs, it's less critical.
    // For now, let's keep it simple and just use the uploadedImages)

    await set(rtdbRef(rtdb, `postMeta/${postRef.id}`), {
      reactionSummary: emptyReactionSummary(),
      commentsCount: 0,
      createdAt: Date.now(),
    });

    return {
      id: postRef.id,
      userId: params.userId,
      user: params.user,
      content: params.content ?? '',
      timestamp: new Date().toISOString(),
      images: uploadedImages,
      comments: [],
      reactions: [],
      reactionSummary: emptyReactionSummary(),
      commentsCount: 0,
      reactionsCount: 0,
    };
  }

  async deletePost(postId: string): Promise<void> {
    const postDocRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postDocRef);

    if (!postSnap.exists()) return;

    const postData = postSnap.data();

    const images = postData.images ?? [];
    for (const image of images) {
      if (image?.path) {
        try {
          await deleteObject(storageRef(storage, image.path));
        } catch {}
      }
    }

    await remove(rtdbRef(rtdb, `postComments/${postId}`));
    await remove(rtdbRef(rtdb, `postReactions/${postId}`));
    await remove(rtdbRef(rtdb, `postMeta/${postId}`));

    await deleteDoc(postDocRef);
  }

  async reactPost(params: {
    postId: string;
    user: UserPreviewModel;
    type: ReactionActionType;
  }): Promise<ReactionSummaryModel> {
    const reactionRef = rtdbRef(
      rtdb,
      `postReactions/${params.postId}/${params.user.studentId}`
    );
    const summaryRef = rtdbRef(rtdb, `postMeta/${params.postId}/reactionSummary`);

    const currentReactionSnap = await get(reactionRef);
    const existingType = currentReactionSnap.exists()
      ? (currentReactionSnap.val()?.type as ReactionType | null)
      : null;

    const transactionResult = await runTransaction(summaryRef, (current) => {
      const next: ReactionSummaryModel = current ?? emptyReactionSummary();

      const removeType = (type?: ReactionType | null) => {
        if (!type) return;
        next[type] = Math.max(0, (next[type] ?? 0) - 1);
        next.total = Math.max(0, (next.total ?? 0) - 1);
      };

      const addType = (type?: ReactionType | null) => {
        if (!type) return;
        next[type] = (next[type] ?? 0) + 1;
        next.total = (next.total ?? 0) + 1;
      };

      if (params.type === 'unreact') {
        if (existingType) {
          removeType(existingType);
        }
      } else if (existingType) {
        if (existingType !== params.type) {
          removeType(existingType);
          addType(params.type);
        }
      } else {
        addType(params.type);
      }

      return next;
    });

    if (params.type === 'unreact') {
      if (currentReactionSnap.exists()) {
        await remove(reactionRef);
      }
    } else {
      await set(reactionRef, {
        user: params.user,
        type: params.type,
        updatedAt: Date.now(),
      });
    }

    const updatedSummary =
      (transactionResult.snapshot?.val() as ReactionSummaryModel | null) ??
      emptyReactionSummary();

    await updateDoc(doc(db, POSTS_COLLECTION, params.postId), {
      reactionSummary: updatedSummary,
      reactionsCount: updatedSummary.total,
    });

    return updatedSummary;
  }

  async getComments(postId: string): Promise<CommentModel[]> {
    const commentsRef = rtdbRef(rtdb, `postComments/${postId}`);
    const snapshot = await get(commentsRef);

    if (!snapshot.exists()) return [];

    const value = snapshot.val() as Record<string, any>;

    const commentsFlat: CommentModel[] = Object.entries(value).map(
      ([id, data]: [string, any]) => ({
        id,
        postId: data.postId,
        user: data.user,
        content: data.content,
        timestamp: toIsoString(data.timestamp),
        parentCommentId: data.parentCommentId ?? null,
        replies: [],
        reactions: [],
      })
    );

    return buildCommentTree(commentsFlat);
  }

  async addComment(params: {
    postId: string;
    user: UserPreviewModel;
    content: string;
    parentCommentId?: string | null;
  }): Promise<string> {
    const commentsRef = rtdbRef(rtdb, `postComments/${params.postId}`);
    const newCommentRef = push(commentsRef);
    const commentId = newCommentRef.key;

    if (!commentId) {
      throw new Error('Cannot create comment id');
    }

    await set(newCommentRef, {
      id: commentId,
      postId: params.postId,
      user: params.user,
      content: params.content,
      parentCommentId: params.parentCommentId ?? null,
      timestamp: Date.now(),
    });

    const countResult = await runTransaction(
      rtdbRef(rtdb, `postMeta/${params.postId}/commentsCount`),
      (current) => (current ?? 0) + 1
    );

    const nextCommentsCount = Number(countResult.snapshot?.val() ?? 0);

    await updateDoc(doc(db, POSTS_COLLECTION, params.postId), {
      commentsCount: nextCommentsCount,
    });

    return commentId;
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    const allCommentsRef = rtdbRef(rtdb, `postComments/${postId}`);
    const allCommentsSnap = await get(allCommentsRef);

    if (!allCommentsSnap.exists()) return;

    const commentsMap = allCommentsSnap.val() as Record<string, any>;
    if (!commentsMap[commentId]) return;

    const descendants = getAllDescendantCommentIds(commentsMap, commentId);
    const idsToDelete = [commentId, ...descendants];

    const updates: Record<string, null> = {};
    idsToDelete.forEach((id) => {
      updates[`postComments/${postId}/${id}`] = null;
    });

    await update(rtdbRef(rtdb), updates);

    const countResult = await runTransaction(
      rtdbRef(rtdb, `postMeta/${postId}/commentsCount`),
      (current) => Math.max(0, (current ?? 0) - idsToDelete.length)
    );

    const nextCommentsCount = Number(countResult.snapshot?.val() ?? 0);

    await updateDoc(doc(db, POSTS_COLLECTION, postId), {
      commentsCount: nextCommentsCount,
    });
  }

  subscribePosts(
    callback: (posts: PostModel[]) => void,
    studentId?: string
  ) {
    const postsRef = collection(db, POSTS_COLLECTION);

    const q = studentId
      ? query(
          postsRef,
          where('userId', '==', studentId),
          orderBy('timestamp', 'desc'),
          limit(15)
        )
      : query(postsRef, orderBy('timestamp', 'desc'), limit(15));

    return onSnapshot(q, (snapshot) => {
      const posts: PostModel[] = snapshot.docs.map((item) =>
        mapPostDocToModel(item.id, item.data())
      );

      callback(posts);
    });
  }

  subscribePostReactionSummary(
    postId: string,
    callback: (summary: ReactionSummaryModel) => void
  ) {
    const summaryRef = rtdbRef(rtdb, `postMeta/${postId}/reactionSummary`);

    return onValue(summaryRef, (snapshot) => {
      callback(
        (snapshot.val() ?? emptyReactionSummary()) as ReactionSummaryModel
      );
    });
  }

  subscribeMyReaction(
    postId: string,
    studentId: string,
    callback: (reactionType: ReactionType | null) => void
  ) {
    const reactionRef = rtdbRef(rtdb, `postReactions/${postId}/${studentId}`);

    return onValue(reactionRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback((snapshot.val()?.type ?? null) as ReactionType | null);
    });
  }

  subscribeComments(
    postId: string,
    callback: (comments: CommentModel[]) => void
  ) {
    const commentsRef = rtdbRef(rtdb, `postComments/${postId}`);

    return onValue(commentsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const value = snapshot.val() as Record<string, any>;

      const commentsFlat: CommentModel[] = Object.entries(value).map(
        ([id, data]: [string, any]) => ({
          id,
          postId: data.postId,
          user: data.user,
          content: data.content,
          timestamp: toIsoString(data.timestamp),
          parentCommentId: data.parentCommentId ?? null,
          replies: [],
          reactions: [],
        })
      );

      callback(buildCommentTree(commentsFlat));
    });
  }
}

export const postRepo = new PostRepo();