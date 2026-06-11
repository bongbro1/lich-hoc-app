import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Dimensions,
    Modal,
    StatusBar,
    Pressable,
    TouchableWithoutFeedback,
    Share,
    Platform
} from 'react-native';
import { Image } from 'expo-image';
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

function PostImages({ images, hasText }: { images: string[]; hasText: boolean }) {
    if (!images || images.length === 0) return null;

    const imageSize = (windowWidth - 48 - spacing * 2) / 3;
    const { openModal } = useImageFullModal();

    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: hasText ? 12 : 0, marginBottom: 4 }}>
            {images.map((uri, index) => (
                <Pressable
                    key={`${uri}-${index}`}
                    onPress={() => openModal(images, index)}
                    style={({ pressed }) => [
                        {
                            width: imageSize,
                            height: imageSize,
                            marginRight: (index + 1) % 3 === 0 ? 0 : spacing,
                            marginBottom: spacing,
                            transform: [{ scale: pressed ? 0.96 : 1 }]
                        }
                    ]}
                >
                    <Image
                        source={{ uri }}
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 12,
                            backgroundColor: '#F1F5F9',
                        }}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                </Pressable>
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

    const theme = useMemo(() => ({
        bg: darkMode ? '#1E293B' : '#fff',
        text: darkMode ? '#F8FAFC' : Colors.text,
        textMuted: darkMode ? '#94A3B8' : Colors.subText,
        border: darkMode ? '#334155' : '#E2E8F0',
        input: darkMode ? '#334155' : '#F3F4F6',
    }), [darkMode]);

    const themedStyles = useMemo(() => StyleSheet.create({
        postContainer: {
            borderColor: theme.border,
        },
        postActionsRow: {
            // Border is now handled by the bottom border of the meta row to match the HTML design perfectly
        },
        optionMenu: {
            backgroundColor: theme.bg,
            borderColor: theme.border,
            borderWidth: darkMode ? 1 : 0,
        }
    }), [theme, darkMode]);

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
            await Share.share({
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
                console.log('Send to message');
            }
        },
        {
            label: 'Chia sẻ lên bảng tin',
            icon: 'rss-feed',
            onPress: () => {
                console.log('Share to feed');
            }
        },
        {
            label: 'Sao chép liên kết',
            icon: 'link',
            onPress: () => {
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
            <View style={[styles.postContainer, themedStyles.postContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.postHeader}>
                    {/* Glowing outer ring wrapper for avatar */}
                    <View style={[styles.avatarWrapper, { borderColor: Colors.primary + '15' }]}>
                        <Image
                            source={{ uri: post.user?.avatar || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    </View>
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

                {post.content ? (
                    <Text style={[styles.postContent, { color: darkMode ? '#CBD5E1' : '#4B5563' }]}>
                        {post.content}
                    </Text>
                ) : null}

                {post.images && post.images.length > 0 && (
                    <PostImages
                        images={post.images.map((img) => img.url) || []}
                        hasText={!!post.content?.trim()}
                    />
                )}

                {/* Meta Row: Reactions & Comments count */}
                {(reactionSummary.total > 0 || countComments(comments) > 0) && (
                    <View style={[styles.metaRow]}>
                        {/* Left: Reactions */}
                        {reactionSummary.total > 0 ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {Object.entries(reactionSummary)
                                        .filter(([type, count]) => type !== 'total' && (count as number) > 0)
                                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                                        .slice(0, 3)
                                        .map(([type, count], index) => (
                                            <View
                                                key={type}
                                                style={[
                                                    styles.miniBadgeWrapper,
                                                    {
                                                        marginLeft: index === 0 ? 0 : -4,
                                                        zIndex: 3 - index,
                                                        borderColor: theme.bg,
                                                        backgroundColor: theme.bg,
                                                    }
                                                ]}
                                            >
                                                <ReactionBadge type={type as ReactionType} size={17} outlined={false} />
                                            </View>
                                        ))}
                                </View>
                                <Text style={[styles.metaText, { color: darkMode ? '#94A3B8' : '#5c5f61', marginLeft: 8 }]}>
                                    {`${reactionSummary.total} lượt thích`}
                                </Text>
                            </View>
                        ) : (
                            <View />
                        )}

                        {/* Right: Comments */}
                        {countComments(comments) > 0 && (
                            <Text style={[styles.metaText, { color: darkMode ? '#94A3B8' : '#5c5f61' }]}>
                                {`${countComments(comments)} bình luận`}
                            </Text>
                        )}
                    </View>
                )}

                <View style={[styles.postActionsRow]}>
                    <View style={styles.postActionItem}>
                        <Pressable
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            delayLongPress={250}
                            style={({ pressed }) => [
                                styles.postAction,
                                {
                                    transform: [{ scale: pressed ? 0.95 : 1 }]
                                }
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
                                        <Text style={[styles.postActionText, { color: theme.textMuted }]}>Thích</Text>
                                    </View>
                                )}
                            </View>
                        </Pressable>
                    </View>

                    <View style={styles.postActionItem}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.postAction,
                                {
                                    transform: [{ scale: pressed ? 0.95 : 1 }]
                                }
                            ]}
                            onPress={handleCommentButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color={theme.textMuted} />
                            <Text style={[styles.postActionText, { color: theme.textMuted }]}>
                                Bình luận
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.postActionItem}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.postAction
                            ]}
                            onPress={handleShare}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-redo-outline" size={22} color={theme.textMuted} />
                            <Text style={[styles.postActionText, { color: theme.textMuted }]}>Chia sẻ</Text>
                        </Pressable>
                    </View>
                </View>

                {showComments && (
                    <View style={{ paddingBottom: 16 }}>
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
                    <View style={[styles.optionMenu, themedStyles.optionMenu]}>
                        <Pressable
                            style={({ pressed }) => [styles.optionItem, { backgroundColor: pressed ? (darkMode ? '#33415550' : '#F1F5F9') : 'transparent' }]}
                            onPress={handleEdit}
                        >
                            <Text style={[styles.optionText, { color: theme.text }]}>Sửa bài viết</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [styles.optionItem, { backgroundColor: pressed ? '#EF444410' : 'transparent' }]}
                            onPress={() => {
                                onDelete(post.id);
                                setShowOptions(false);
                            }}
                        >
                            <Text style={[styles.optionText, { color: '#EF4444' }]}>
                                Xóa bài viết
                            </Text>
                        </Pressable>
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
        borderCurve: 'continuous',
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    optionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    optionText: {
        fontSize: 15,
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
        padding: 16,
        paddingBottom: 0,
        marginBottom: 4,
        borderCurve: 'continuous',
        borderWidth: 0.5,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.02,
                shadowRadius: 12,
            },
            android: {
                elevation: 0.2,
            },
        }),
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarWrapper: {
        borderRadius: 24,
        borderCurve: 'continuous',
        borderWidth: 1,
        padding: 1.5,
        marginRight: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    timestamp: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    postContent: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 4,
    },
    postActionsRow: {
        flexDirection: 'row',
        marginHorizontal: -16,
        paddingHorizontal: 16,
        // paddingVertical: 4,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0'
    },
    postActionItem: {
        flex: 1,
    },
    postAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12, // Tăng diện tích chạm theo chiều dọc
        borderRadius: 10,
        borderCurve: 'continuous',
        gap: 6,
    },
    inactiveReactionWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    activeReactionWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    postActionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    activeReactionText: {
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: -16,
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 10,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '400',
    },
    miniBadgeWrapper: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});

export default React.memo(PostItem);
