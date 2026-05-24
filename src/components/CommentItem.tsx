import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text, Image } from 'react-native';
import { formatTimeAgo } from '../utils/date';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ReactionBar } from './ReactionBar';
import { useUser } from '../contexts/UserContext';
import * as RootNavigation from '../navigation/RootNavigation';
import { CommentItemProps } from 'models/comment';
import { ReactionType } from 'models/post';


export default function CommentItem({ comment, level = 0, onReact, onReply, onDelete }: CommentItemProps) {
  const reactionCount = comment.reactions?.length || 0;
  const [showReactions, setShowReactions] = useState(false);
  const { user: currentUser } = useUser();
  const isCurrentUserComment = comment.user.studentId === currentUser!.studentId;

  const handleSelectReaction = async (type: ReactionType) => {
    if (!comment || !currentUser) return;

    try {
      if (type === 'unreact') {
        // 🔹 Bỏ reaction
        return;
      }
    } catch (error) {
      console.error('Error reacting to post:', error);
    } finally {
      setShowReactions(false); // ẩn reaction bar
    }
  };

  const handlePressGoProfile = () => {
    RootNavigation.navigate("Dashboard", {
      screen: "ProfileFeedScreen",
      params: {
        studentId: comment.user.studentId
      },
    });
  };


  return (
    <View style={{ marginLeft: level * 10 }}>
      <View
        style={[
          styles.commentItem,
          (comment.replies?.length ?? 0) > 0 && { borderBottomWidth: 0, borderBottomColor: 'transparent' },
          comment.parentCommentId && { marginLeft: 32 },
        ]}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={handlePressGoProfile}>
          <Image
            source={{ uri: comment.user.avatar || 'https://i.pravatar.cc/40' }}
            style={styles.commentAvatar}
          />
        </TouchableOpacity>

        <View style={styles.commentContentContainer}>
          <View style={styles.commentBubble}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePressGoProfile}>
              <Text style={styles.commentUser}>{comment.user.name}</Text>
            </TouchableOpacity>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>

          <View style={styles.commentMeta}>
            {comment.timestamp && (
              <Text style={styles.commentTime}>
                {formatTimeAgo(comment.timestamp)}
              </Text>
            )}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onReact?.(comment.id)}
              onLongPress={() => setShowReactions(true)}
            >
              <Text style={styles.commentAction}>Thích</Text>
              {showReactions && <ReactionBar onSelect={() => { }} />}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={() => onReply?.(comment.id)}>
              <Text style={styles.commentAction}>Phản hồi</Text>
            </TouchableOpacity>

            {isCurrentUserComment && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => onDelete?.(comment.id)}>
                <Text style={[styles.commentAction, { color: '#e0245e' }]}>Xóa</Text>
              </TouchableOpacity>
            )}

            {reactionCount > 0 && (
              <View style={styles.reactionBadge}>
                <Icon name="thumbs-up" size={10} color="#1877f2" />
                <Text style={styles.reactionCount}>{reactionCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Render comment con nếu có */}
      {comment.replies?.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          level={level + 1} // tăng thụt
          onReact={onReact}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    marginTop: 6,
  },
  commentContentContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 16,
    padding: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: 'bold',
    color: '#050505',
    fontSize: 14,
    paddingBottom: 2
  },
  /** 👉 Thêm mới **/
  commentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    gap: 14, // khoảng cách giữa các nút
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginLeft: 8,
  },
  commentBubble: {
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  commentContent: {
    fontSize: 14,
    color: '#050505',
    lineHeight: 18,
  },

  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    paddingHorizontal: 10,
  },

  commentTime: {
    fontSize: 12,
    color: '#65676b',
  },

  commentAction: {
    fontSize: 12,
    color: '#65676b',
    fontWeight: '500',
  },

  commentActionLiked: {
    color: '#1877f2',
  },
  reactionCount: {
    fontSize: 12,
    color: '#1877f2',
    marginLeft: 3,
    fontWeight: '600',
  },
});
