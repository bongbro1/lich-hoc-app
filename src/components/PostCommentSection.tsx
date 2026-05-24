import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from 'contexts/UserContext';
import { usePostVM } from 'viewmodels/usePostVM';
import { formatTimeAgo } from 'utils/date';
import { Colors } from 'utils/theme';
import { SORT_OPTIONS, SortMode } from 'configs/constants';

type ReplyTarget = {
    id?: string;
    name: string;
};

type Props = {
    postId: string;
    postOwnerId: string;
    onComposerFocus?: (input: TextInput | null) => void;
};

export type PostCommentSectionRef = {
    focusComposer: () => void;
};

const PostCommentSection = forwardRef<PostCommentSectionRef, Props>(
    ({ postId, postOwnerId, onComposerFocus }, ref) => {
        const navigation = useNavigation<any>();
        const { user: currentUser } = useUser();
        const { addComment, deleteComment, subscribeComments } = usePostVM();

        const commentsScrollRef = useRef<ScrollView>(null);
        const commentInputRef = useRef<TextInput>(null);

        const { darkMode } = useUser();
        const theme = {
            bg: darkMode ? '#1E293B' : '#fff',
            text: darkMode ? '#F8FAFC' : '#0F172A',
            textMuted: darkMode ? '#94A3B8' : '#64748B',
            border: darkMode ? '#334155' : '#F1F5F9',
            input: darkMode ? '#334155' : '#F3F4F6',
            bubble: darkMode ? '#334155' : '#F3F4F6',
        };

        const [comments, setComments] = useState<any[]>([]);
        const [newComment, setNewComment] = useState('');
        const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
        const [expanded, setExpanded] = useState(false);
        const [sortMode, setSortMode] = useState<'top' | 'newest' | 'all'>('top');
        const [showFilterMenu, setShowFilterMenu] = useState(false);

        const scrollCommentsToBottom = (animated = true) => {
            commentsScrollRef.current?.scrollToEnd({ animated });
        };

        const focusComposer = () => {
            commentInputRef.current?.focus();
            onComposerFocus?.(commentInputRef.current);
        };

        useImperativeHandle(ref, () => ({
            focusComposer,
        }));
        const filterLabel = SORT_OPTIONS[sortMode];

        const sortedComments = useMemo(() => {
            const cloned = [...comments];

            switch (sortMode) {
                case 'newest':
                    cloned.sort(
                        (a, b) =>
                            new Date(b?.timestamp || 0).getTime() -
                            new Date(a?.timestamp || 0).getTime()
                    );
                    break;

                case 'all':
                    cloned.sort(
                        (a, b) =>
                            new Date(a?.timestamp || 0).getTime() -
                            new Date(b?.timestamp || 0).getTime()
                    );
                    break;

                case 'top':
                default:
                    cloned.sort((a, b) => {
                        const aScore = (a?.replies?.length || 0) + (a?.reactions?.length || 0);
                        const bScore = (b?.replies?.length || 0) + (b?.reactions?.length || 0);

                        if (bScore !== aScore) return bScore - aScore;

                        return (
                            new Date(b?.timestamp || 0).getTime() -
                            new Date(a?.timestamp || 0).getTime()
                        );
                    });
                    break;
            }

            return cloned;
        }, [comments, sortMode]);

        const visibleComments = useMemo(() => {
            return expanded ? sortedComments : sortedComments.slice(0, 4);
        }, [expanded, sortedComments]);

        useEffect(() => {
            const unsubscribe = subscribeComments(postId, (data) => {
                setComments(data || []);
            });

            return unsubscribe;
        }, [postId, subscribeComments]);

        const findCommentById = (items: any[], commentId?: string): any | null => {
            if (!commentId) return null;

            for (const item of items) {
                if (item?.id === commentId) return item;

                const foundInReplies = findCommentById(item?.replies || [], commentId);
                if (foundInReplies) return foundInReplies;
            }

            return null;
        };

        const handleAddComment = async () => {
            if (!newComment.trim() || !currentUser) return;

            try {
                const content = newComment;
                const parentComment = replyTarget?.id
                    ? findCommentById(comments, replyTarget.id)
                    : null;
                const parentCommentOwnerId = parentComment?.user?.studentId;

                setNewComment('');
                setReplyTarget(null);

                const result = await addComment(
                    postId,
                    postOwnerId,
                    {
                        studentId: currentUser.studentId,
                        name: currentUser.name ?? '',
                        avatar: currentUser.avatar ?? null,
                    },
                    content,
                    replyTarget?.id,
                    parentCommentOwnerId
                );

                if (!result.success) {
                    console.error(result.error);
                    return;
                }

                setTimeout(() => {
                    scrollCommentsToBottom(true);
                    commentInputRef.current?.focus();
                }, 80);
            } catch (error) {
                console.error('Add comment error:', error);
            }
        };

        const handleDeleteComment = async (commentId: string) => {
            try {
                const result = await deleteComment(postId, commentId);

                if (!result.success) {
                    console.error(result.error);
                }
            } catch (error) {
                console.error('Delete comment error:', error);
            }
        };

        const handleReply = (item: any, name: string) => {
            setReplyTarget({ id: item?.id, name });
            setTimeout(focusComposer, 60);
        };

        const CommentNode = ({ item, level = 0 }: any) => {
            const name = item?.user?.name || 'Người dùng';
            const avatar = item?.user?.avatar;
            const content = item?.content || '';
            const canDeleteComment =
                !!currentUser?.studentId &&
                currentUser.studentId === item?.user?.studentId;
            const canReply = level < 2;
            const time = item?.timestamp || 'Vừa xong';

            const handleGoToProfile = () => {
                if (item?.user?.studentId) {
                    navigation.navigate('ProfileFeedScreen', { studentId: item.user.studentId });
                }
            };

            return (
                <View style={{ marginLeft: level > 0 ? 16 : 0, marginTop: 6 }}>
                    <View style={styles.commentRow}>
                        <TouchableOpacity activeOpacity={0.7} onPress={handleGoToProfile}>
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarFallback]}>
                                    <Ionicons name="person" size={14} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.commentContentWrap}>
                            <View style={[styles.commentBubble, { backgroundColor: theme.bubble }]}>
                                <TouchableOpacity activeOpacity={0.7} onPress={handleGoToProfile}>
                                    <Text style={[styles.commentName, { color: theme.text }]}>{name}</Text>
                                </TouchableOpacity>
                                <Text style={[styles.commentText, { color: darkMode ? '#CBD5E1' : '#1F2937' }]}>{content}</Text>
                            </View>

                            <View style={styles.commentMetaRow}>
                                <Text style={[styles.metaText, { color: theme.textMuted }]}>{formatTimeAgo(time)}</Text>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => handleReply(item, name)}
                                        disabled={!canReply}
                                        style={!canReply ? { display: 'none' } : undefined}
                                    >
                                        <Text style={[styles.metaAction, { color: theme.textMuted }]}>Phản hồi</Text>
                                    </TouchableOpacity>

                                {canDeleteComment && (
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => handleDeleteComment(item?.id)}
                                    >
                                        <Text style={[styles.metaAction, { color: '#EF4444' }]}>
                                            Xóa
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {!!item?.replies?.length && (
                                <View style={{ marginTop: 6 }}>
                                    {item.replies.map((reply: any) => (
                                        <CommentNode
                                            key={reply.id?.toString() || `${item?.id}-reply`}
                                            item={reply}
                                            level={level + 1}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            );
        };

        return (
            <View style={[styles.wrapper, { backgroundColor: theme.bg }]}>
                <View style={styles.filterRow}>
                    <View style={{ position: 'relative' }}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={[styles.filterChip, { backgroundColor: theme.bubble }]}
                            onPress={() => setShowFilterMenu((prev) => !prev)}
                        >
                            <Text style={[styles.filterChipText, { color: theme.text }]}>{filterLabel}</Text>
                            <Ionicons
                                name={showFilterMenu ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color={theme.textMuted}
                            />
                        </TouchableOpacity>

                        {showFilterMenu && (
                            <>
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={styles.optionOverlay}
                                    onPress={() => setShowFilterMenu(false)}
                                />

                                <View style={[styles.optionMenu, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                                    {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={styles.optionItem}
                                            onPress={() => {
                                                setSortMode(key as SortMode);
                                                setShowFilterMenu(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    { color: theme.text },
                                                    sortMode === key && styles.optionTextActive,
                                                ]}
                                            >
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>

                    {comments.length > 5 && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setExpanded((prev) => !prev)}
                        >
                            <Text style={styles.expandText}>
                                {expanded ? 'Ẩn bớt' : 'Xem thêm'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ maxHeight: 400 }}>
                    <ScrollView
                        ref={commentsScrollRef}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 10 }}
                    >
                        {visibleComments.length > 0 ? (
                            visibleComments.map((item, index) => (
                                <View key={item?.id?.toString?.() || String(index)}>
                                    <CommentNode item={item} />
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyText}>
                                    Chưa có bình luận nào
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {replyTarget && (
                    <View style={styles.replyBadge}>
                        <Text style={styles.replyText} numberOfLines={1}>
                            {'Đang phản hồi '}
                            <Text style={styles.replyName}>{replyTarget.name}</Text>
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setReplyTarget(null)}
                            style={styles.replyCloseBtn}
                        >
                            <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputOuter}>
                    <View style={[styles.inputBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
                        <TextInput
                            ref={commentInputRef}
                            placeholder={
                                replyTarget
                                    ? `Phản hồi ${replyTarget.name}...`
                                    : 'Viết bình luận...'
                            }
                            placeholderTextColor={theme.textMuted}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            style={[styles.input, { color: theme.text }]}
                            onFocus={() => {
                                onComposerFocus?.(commentInputRef.current);
                                setTimeout(() => scrollCommentsToBottom(true), 40);
                            }}
                        />

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleAddComment}
                            style={[
                                styles.sendBtn,
                                { opacity: newComment.trim() ? 1 : 0.5 },
                            ]}
                            disabled={!newComment.trim()}
                        >
                            <Ionicons name="send" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        zIndex: 20,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginRight: 4,
    },
    expandText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    optionOverlay: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    optionMenu: {
        position: 'absolute',
        top: 38,
        left: 0,
        width: 180,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
        zIndex: 2,
    },
    optionItem: {
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    optionText: {
        fontSize: 14,
        color: '#374151',
    },
    optionTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    wrapper: {
        marginTop: 4,
        paddingTop: 8,
        backgroundColor: Colors.white,
    },
    emptyWrap: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 6,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginTop: 2,
    },
    avatarFallback: {
        backgroundColor: '#94A3B8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentContentWrap: {
        flex: 1,
    },
    commentBubble: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    commentName: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#1F2937',
    },
    commentMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        paddingHorizontal: 6,
    },
    metaText: {
        fontSize: 12,
        color: Colors.subText,
        marginRight: 12,
    },
    metaAction: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.subText,
        marginRight: 12,
    },
    replyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: `${Colors.primary}15`,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: `${Colors.primary}30`,
    },
    replyText: {
        fontSize: 12,
        color: Colors.primary,
    },
    replyName: {
        fontWeight: '700',
        color: Colors.primary,
    },
    replyCloseBtn: {
        marginLeft: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
    },
    inputOuter: {
        marginTop: 0,
        paddingTop: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F3F4F6',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingLeft: 12,
        paddingRight: 6,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        maxHeight: 90,
        fontSize: 14,
        color: Colors.text,
        paddingTop: 6,
        paddingBottom: 6,
        paddingRight: 8,
    },
    sendBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
});

export default PostCommentSection;
