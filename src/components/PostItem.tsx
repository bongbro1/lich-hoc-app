import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Modal,
    StatusBar,
    Pressable,
    TouchableWithoutFeedback,
    Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactionBadge, ReactionBar, reactionIcons } from './ReactionBar';
import { useUser } from '../contexts/UserContext';
import { formatTimeAgo } from '../utils/date';
import { useImageFullModal } from '../contexts/ImageFullModalContext';
import { ThumbsUp } from 'phosphor-react-native';
import { Colors } from '../utils/theme';
import {
    PostModel,
    ReactionActionType,
    ReactionSummaryModel,
    ReactionType,
} from 'models/post';
import { usePostVM } from 'viewmodels/usePostVM';
import { CommentModel } from 'models/comment';
import PostCommentSection, { PostCommentSectionRef } from './PostCommentSection';
import BottomActionSheet, { BottomAction } from './BottomActionSheet';

type PostItemProps = {
    post: PostModel;
    currentUserId?: string;
    refreshTrigger: number;
    onDelete: (postId: string) => void;
    itemIndex: number;
    onComposerFocus?: (input: TextInput | null) => void;
    onRequestCommentFocus?: (index: number) => void;
};

const windowWidth = Dimensions.get('window').width;
const spacing = 4;

function PostImages({ images }: { images: string[] }) {
    if (!images || images.length === 0) return null;

    const imageSize = (windowWidth - 48 - spacing * 2) / 3;
    const { openModal } = useImageFullModal();

    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginBottom: 4 }}>
            {images.map((uri, index) => (
                <TouchableOpacity
                    activeOpacity={0.9}
                    key={`${uri}-${index}`}
                    onPress={() => openModal(images, index)}
                    style={{
                        width: imageSize,
                        height: imageSize,
                        marginRight: (index + 1) % 3 === 0 ? 0 : spacing,
                        marginBottom: spacing,
                    }}
                >
                    <Image
                        source={{ uri }}
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 12,
                            backgroundColor: '#F1F5F9',
                        }}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

const PostItem: React.FC<PostItemProps> = ({
    post,
    refreshTrigger,
    onDelete,
    itemIndex,
    onComposerFocus,
    onRequestCommentFocus,
}) => {
    const { user: currentUser, darkMode } = useUser();
    const commentSectionRef = useRef<PostCommentSectionRef>(null);
    const {
        reactPost,
        subscribeComments,
        subscribeMyReaction,
        subscribePostReactionSummary,
    } = usePostVM();

    const theme = {
        bg: darkMode ? '#1E293B' : '#fff',
        text: darkMode ? '#F8FAFC' : Colors.text,
        textMuted: darkMode ? '#94A3B8' : Colors.subText,
        border: darkMode ? '#334155' : '#F1F5F9',
        input: darkMode ? '#334155' : '#F3F4F6',
    };

    const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState<CommentModel[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [pendingCommentFocus, setPendingCommentFocus] = useState(false);
    const [showReactions, setShowReactions] = useState(false);

    const currentReaction = userReaction ? reactionIcons[userReaction] : null;

    const [reactionSummary, setReactionSummary] = useState<ReactionSummaryModel>(
        post.reactionSummary ?? { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0, total: 0 }
    );

    const likeRef = useRef(null);
    const [likeButtonPos, setLikeButtonPos] = useState({ x: 0, y: 0 });
    const [showOptions, setShowOptions] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState('');

    useEffect(() => {
        if (!currentUser?.studentId) return;

        const unsubscribe = subscribeMyReaction(
            post.id,
            currentUser.studentId,
            (reactionType) => {
                setUserReaction(reactionType);
                setLiked(!!reactionType);
            }
        );

        return unsubscribe;
    }, [post.id, currentUser?.studentId, subscribeMyReaction]);

    useEffect(() => {
        const unsubscribe = subscribePostReactionSummary(post.id, (summary) => {
            setReactionSummary(summary);
        });

        return unsubscribe;
    }, [post.id, subscribePostReactionSummary]);

    useEffect(() => {
        const unsubscribe = subscribeComments(post.id, (data) => {
            setComments(data);
        });

        return unsubscribe;
    }, [post.id, subscribeComments]);

    useEffect(() => {
        if (!showComments || !pendingCommentFocus) return;

        const timer = setTimeout(() => {
            // Tự động cuộn tới bài viết để hiện phần bình luận
            onRequestCommentFocus?.(itemIndex);
            setPendingCommentFocus(false);
        }, 150);

        return () => {
            clearTimeout(timer);
        };
    }, [itemIndex, onRequestCommentFocus, pendingCommentFocus, showComments]);

    const handleLike = () => {
        if (userReaction) {
            handleSelectReaction('unreact' as ReactionType);
        } else {
            handleSelectReaction('like');
        }
    };

    const handleSelectReaction = async (type: ReactionActionType) => {
        if (!post || !currentUser) return;

        const prevReaction = userReaction;
        setShowReactions(false);

        if (type === 'unreact') {
            setUserReaction(null);
        } else {
            setUserReaction(type);
        }

        try {
            const result = await reactPost(
                post.id,
                post.user.studentId,
                {
                    studentId: currentUser.studentId,
                    name: currentUser.name ?? '',
                    avatar: currentUser.avatar ?? null,
                },
                type
            );

            if (!result.success) {
                setUserReaction(prevReaction);
                console.error(result.error);
            }
        } catch (error) {
            console.error('Reaction error:', error);
            setUserReaction(prevReaction);
        }
    };

    const handleCommentButton = useCallback(() => {
        const nextState = !showComments;
        setShowComments(nextState);
        if (nextState) {
            setPendingCommentFocus(true);
        } else {
            setPendingCommentFocus(false);
        }
    }, [showComments]);

    const [showShareSheet, setShowShareSheet] = useState(false);

    const handleShare = () => {
        setShowShareSheet(true);
    };

    const handleSystemShare = async () => {
        try {
            const result = await Share.share({
                message: `${post.user.name}: "${post.content}"\n\nChia sẻ từ ứng dụng Lịch học.`,
            });
        } catch (error: any) {
            console.error('Share error:', error.message);
        }
    };

    const shareActions: BottomAction[] = [
        {
            label: 'Gửi qua tin nhắn',
            icon: 'send',
            onPress: () => {
                // Placeholder for internal messaging
                console.log('Send to message');
            }
        },
        {
            label: 'Chia sẻ lên bảng tin',
            icon: 'rss-feed',
            onPress: () => {
                // Placeholder for re-post
                console.log('Share to feed');
            }
        },
        {
            label: 'Sao chép liên kết',
            icon: 'link',
            onPress: () => {
                // Since clipboard lib is missing, we can show a message or just log
                console.log('Copy link clicked');
            }
        },
        {
            label: 'Tùy chọn khác...',
            icon: 'more-horiz',
            onPress: handleSystemShare
        }
    ];

    const handleEdit = async () => { };

    const countComments = (items: CommentModel[]): number => {
        return items.reduce((total, comment) => {
            return total + 1 + countComments(comment.replies || []);
        }, 0);
    };

    return (
        <>
            <View style={[styles.postContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.postHeader}>
                    <Image source={{ uri: post.user?.avatar || '' }} style={styles.avatar} />
                    <View style={{ marginLeft: 4, flex: 1 }}>
                        <Text style={[styles.userName, { color: theme.text }]}>{post.user?.name}</Text>
                        <Text style={[styles.timestamp, { color: theme.textMuted }]}>{formatTimeAgo(post.timestamp!)}</Text>
                    </View>
                    <Pressable
                        onPress={() => {
                            setShowOptions(true);
                            setSelectedPostId(post.id);
                        }}
                    >
                        <MaterialCommunityIcons name="dots-vertical" size={24} color={darkMode ? '#94A3B8' : "#666"} />
                    </Pressable>
                </View>

                <Text style={[styles.postContent, { color: darkMode ? '#CBD5E1' : '#4B5563' }]}>{post.content}</Text>

                {post.images && <PostImages images={post.images.map((img) => img.url) || []} />}

                {reactionSummary.total > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <View style={{ flexDirection: 'row' }}>
                            {Object.entries(reactionSummary)
                                .filter(([type, count]) => type !== 'total' && count > 0)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([type], index) => (
                                    <View
                                        key={type}
                                        style={{
                                            marginLeft: index === 0 ? 0 : -6,
                                        }}
                                    >
                                        <ReactionBadge type={type as ReactionType} size={18} />
                                    </View>
                                ))}
                        </View>

                        <Text style={{ fontSize: 13, color: theme.textMuted, marginLeft: 6 }}>
                            {reactionSummary.total}
                        </Text>
                    </View>
                )}

                <View style={[styles.postActionsRow, { borderTopColor: theme.border }]}>
                    <View style={styles.postActionItem}>
                        <Pressable
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            delayLongPress={250}
                            style={({ pressed }) => [
                                styles.postAction,
                                { opacity: pressed ? 0.6 : 1 }
                            ]}
                            onPress={handleLike}
                            onLongPress={() => {
                                if (!likeRef.current) return;

                                (likeRef.current as any).measureInWindow(
                                    (px: number, py: number, width: number, height: number) => {
                                        const statusBarHeight = StatusBar.currentHeight ?? 0;
                                        const finalY = py - statusBarHeight - height + 30;

                                        setLikeButtonPos({
                                            x: px,
                                            y: finalY,
                                        });
                                        setShowReactions(true);
                                    }
                                );
                            }}
                        >
                            <View ref={likeRef} collapsable={false}>
                                {currentReaction ? (
                                    <View style={styles.activeReactionWrap}>
                                        <ReactionBadge type={userReaction!} size={20} outlined={false} />
                                        <Text
                                            style={[
                                                styles.postActionText,
                                                styles.activeReactionText,
                                                { color: currentReaction.color },
                                            ]}
                                        >
                                            {currentReaction.label}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.inactiveReactionWrap}>
                                        <ThumbsUp size={20} color={theme.textMuted} weight="regular" />
                                    </View>
                                )}
                            </View>
                        </Pressable>
                    </View>

                    <View style={styles.postActionItem}>
                        <TouchableOpacity
                            activeOpacity={0.5}
                            style={styles.postAction}
                            onPress={handleCommentButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color={theme.textMuted} />
                            <Text style={[styles.postActionText, { color: theme.textMuted }]}>
                                {countComments(comments) > 0 ? ` ${countComments(comments)}` : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.postActionItem}>
                        <TouchableOpacity
                            activeOpacity={0.5}
                            style={styles.postAction}
                            onPress={handleShare}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-redo-outline" size={22} color={theme.textMuted} />
                            <Text style={[styles.postActionText, { color: theme.textMuted }]}>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showComments && (
                    <View style={{ paddingBottom: 16, borderTopWidth: 1, borderTopColor: theme.border }}>
                        <PostCommentSection
                            ref={commentSectionRef}
                            postId={post.id}
                            postOwnerId={post.user.studentId}
                            onComposerFocus={onComposerFocus}
                        />
                    </View>
                )}
            </View>

            {showOptions && (
                <View style={styles.optionOverlay}>
                    <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>
                    <View style={[styles.optionMenu, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.optionItem}
                            onPress={handleEdit}
                        >
                            <Text style={[styles.optionText, { color: theme.text }]}>Sửa bài viết</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.optionItem}
                            onPress={() => {
                                onDelete(post.id);
                                setShowOptions(false);
                            }}
                        >
                            <Text style={[styles.optionText, { color: '#EF4444' }]}>
                                Xóa bài viết
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <BottomActionSheet
                visible={showShareSheet}
                onClose={() => setShowShareSheet(false)}
                title="Chia sẻ bài viết"
                actions={shareActions}
            />

            <Modal
                visible={showReactions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowReactions(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowReactions(false)}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>

                <View
                    pointerEvents="box-none"
                    style={{
                        position: 'absolute',
                        top: likeButtonPos.y + (StatusBar.currentHeight ?? 0) + 45,
                        left: 0,
                        right: 0,
                        alignItems: 'center',
                        zIndex: 999,
                        elevation: 999,
                    }}
                >
                    <ReactionBar
                        onSelect={(type) => {
                            handleSelectReaction(type);
                        }}
                    />
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    optionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        zIndex: 1000,
        elevation: 10,
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 40,
    },
    optionMenu: {
        width: 150,
        borderRadius: 12,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
    },
    optionItem: {
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    optionText: {
        fontSize: 15,
        color: '#333',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    postContainer: {
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 0,
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 10,
        backgroundColor: '#F1F5F9',
    },
    userName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text,
    },
    timestamp: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    postContent: {
        fontSize: 15,
        lineHeight: 22,
        color: '#334155',
        marginBottom: 4,
    },
    postActionsRow: {
        flexDirection: 'row',
        marginTop: 10,
        marginHorizontal: -16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    postActionItem: {
        flex: 1,
    },
    postAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12, // Tăng diện tích chạm theo chiều dọc
        borderRadius: 12,
    },
    inactiveReactionWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeReactionWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    postActionText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    activeReactionText: {
        fontWeight: '700',
    },
});

export default React.memo(PostItem);
