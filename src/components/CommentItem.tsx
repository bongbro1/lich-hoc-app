import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text, Image } from 'react-native';
import { formatTimeAgo } from '../utils/date';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { ReactionBar } from './ReactionBar';
import { useUser } from '../contexts/UserContext';
import { useImageFullModal } from '../contexts/ImageFullModalContext';
import * as RootNavigation from '../navigation/RootNavigation';
import { CommentItemProps } from 'models/comment';
import { ReactionType } from 'models/post';


export default function CommentItem({ comment, level = 0, onReact, onReply, onDelete }: CommentItemProps) {
  const reactionCount = comment.reactions?.length || 0;
  const [showReactions, setShowReactions] = useState(false);
  const { user: currentUser, darkMode } = useUser();
  const { openModal } = useImageFullModal();
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
        studentId: comment.user.studentId,
        initialProfile: {
          studentId: comment.user.studentId,
          name: comment.user.name,
          avatar: comment.user.avatar,
        }
      },
    });
  };


  const theme = {
    bg: darkMode ? '#1E293B' : 'transparent',
    text: darkMode ? '#F8FAFC' : '#191b24',
    bubbleBg: darkMode ? '#334155' : '#e0e3e6',
    metaText: darkMode ? '#94A3B8' : '#5c5f61',
  };

  return (
    <View style={{ marginLeft: level > 0 ? 44 : 0 }}>
      <View style={[styles.commentItem, level > 0 && { marginTop: 16, paddingHorizontal: 0 }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={handlePressGoProfile}>
          <Image
            source={{ uri: comment.user.avatar || 'https://i.pravatar.cc/40' }}
            style={level > 0 ? styles.commentAvatarNested : styles.commentAvatar}
          />
        </TouchableOpacity>

        <View style={styles.commentContentContainer}>
          <View style={[styles.commentBubble, { backgroundColor: theme.bubbleBg }]}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePressGoProfile}>
              <Text style={[styles.commentUser, { color: theme.text }]}>{comment.user.name}</Text>
            </TouchableOpacity>
            <Text style={[styles.commentContent, { color: theme.text }]}>{comment.content}</Text>
          </View>

          {comment.imageUrl && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openModal(comment.imageUrl!)}
              style={styles.commentImageWrapper}
            >
              <Image
                source={{ uri: comment.imageUrl }}
                style={styles.commentImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          <View style={styles.commentMeta}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onReact?.(comment.id)}
              onLongPress={() => setShowReactions(true)}
            >
              <Text style={[styles.commentAction, { color: theme.metaText }]}>Thích</Text>
              {showReactions && <ReactionBar onSelect={() => { }} />}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={() => onReply?.(comment.id)}>
              <Text style={[styles.commentAction, { color: theme.metaText }]}>Phản hồi</Text>
            </TouchableOpacity>

            {comment.timestamp && (
              <Text style={[styles.commentTime, { color: theme.metaText }]}>
                {formatTimeAgo(comment.timestamp)}
              </Text>
            )}

            {isCurrentUserComment && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => onDelete?.(comment.id)}>
                <Text style={[styles.commentAction, { color: '#ba1a1a', fontWeight: '400' }]}>Xóa</Text>
              </TouchableOpacity>
            )}

            {reactionCount > 0 && (
              <View style={styles.reactionBadge}>
                <Icon name="thumb-up" size={12} color="#0866ff" />
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
    marginTop: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  commentAvatarNested: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentContentContainer: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#e0e3e6', // secondary-container
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  commentUser: {
    fontWeight: '700',
    color: '#191b24', // on-surface
    fontSize: 13,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 15,
    color: '#191b24',
    lineHeight: 20,
  },
  commentImageWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    backgroundColor: '#e4e6eb',
  },
  commentImage: {
    width: 200,
    height: 250,
    borderRadius: 12,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  commentAction: {
    fontSize: 12,
    color: '#5c5f61', // secondary
    fontWeight: '700', // font-bold
  },
  commentTime: {
    fontSize: 12,
    color: '#5c5f61',
    fontWeight: '400',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginLeft: 'auto', // Push to the right end
  },
  reactionCount: {
    fontSize: 12,
    color: '#1877f2',
    marginLeft: 4,
    fontWeight: '600',
  },
});
