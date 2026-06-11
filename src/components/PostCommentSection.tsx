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
    StyleSheet,
    ScrollView,
    Pressable
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from 'contexts/UserContext';
import { useImageFullModal } from 'contexts/ImageFullModalContext';
import { usePostVM } from 'viewmodels/usePostVM';
import { formatTimeAgo } from 'utils/date';
import { Colors } from 'utils/theme';
import { SORT_OPTIONS, SortMode } from 'configs/constants';
import * as ImagePicker from 'expo-image-picker';

type ReplyTarget = {
    id?: string;
    name: string;
};

type Props = {
    postId: string;
    postOwnerId: string;
    onComposerFocus?: (input: TextInput | null) => void;
};

type CommentNodeProps = {
    item: any;
    level?: number;
    currentUser: any;
    navigation: any;
    darkMode: boolean;
    theme: any;
    themedStyles: any;
    handleReply: (item: any, name: string) => void;
    handleDeleteComment: (commentId: string) => void;
    openModal: (url: string) => void;
};

const CommentNode = React.memo(({
    item,
    level = 0,
    currentUser,
    navigation,
    darkMode,
    theme,
    themedStyles,
    handleReply,
    handleDeleteComment,
    openModal
}: CommentNodeProps) => {
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
        <View>
            <View style={[styles.commentRow, { paddingTop: level > 0 ? 12 : 16 }]}>
                <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                    onPress={handleGoToProfile}
                >
                    <View style={[styles.avatarWrapper, { borderColor: Colors.primary + '15' }]}>
                        {avatar ? (
                            <Image
                                source={{ uri: avatar }}
                                style={level > 0 ? styles.avatarNested : styles.avatar}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View style={[level > 0 ? styles.avatarNested : styles.avatar, styles.avatarFallback]}>
                                <Ionicons name="person" size={12} color="#fff" />
                            </View>
                        )}
                    </View>
                </Pressable>

                <View style={styles.commentContentWrap}>
                    {content.trim() ? (
                        <View style={[styles.commentBubble, themedStyles.commentBubble]}>
                            <Pressable
                                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                                onPress={handleGoToProfile}
                            >
                                <Text style={[styles.commentName, { color: theme.text }]}>{name}</Text>
                            </Pressable>
                            <Text style={[styles.commentText, { color: darkMode ? '#CBD5E1' : '#1F2937' }]}>{content}</Text>
                        </View>
                    ) : (
                        <View style={{ paddingLeft: 4, marginBottom: 2 }}>
                            <Pressable
                                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                                onPress={handleGoToProfile}
                            >
                                <Text style={[styles.commentName, { color: theme.text }]}>{name}</Text>
                            </Pressable>
                        </View>
                    )}

                    {item.imageUrl ? (
                        <Pressable
                            onPress={() => openModal(item.imageUrl)}
                            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                        >
                            <View style={[styles.commentImageContainer, { borderColor: theme.border }]}>
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.commentImage}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                            </View>
                        </Pressable>
                    ) : null}

                    <View style={styles.commentMetaRow}>
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                        >
                            <Text style={[styles.metaAction, { color: theme.textMuted }]}>Thích</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => handleReply(item, name)}
                            disabled={!canReply}
                            style={({ pressed }) => [
                                !canReply ? { display: 'none' } : undefined,
                                { opacity: pressed ? 0.6 : 1 }
                            ]}
                        >
                            <Text style={[styles.metaAction, { color: theme.textMuted }]}>Phản hồi</Text>
                        </Pressable>

                        <Text style={[styles.metaText, { color: theme.textMuted }]}>{formatTimeAgo(time)}</Text>

                        {canDeleteComment && (
                            <Pressable
                                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                                onPress={() => handleDeleteComment(item?.id)}
                            >
                                <Text style={[styles.metaAction, { color: '#ba1a1a', fontWeight: '400' }]}>
                                    Xóa
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {!!item?.replies?.length && (
                        <View style={{ marginTop: 0 }}>
                            {item.replies.map((reply: any) => (
                                <CommentNode
                                    key={reply.id?.toString() || `${item?.id}-reply`}
                                    item={reply}
                                    level={level + 1}
                                    currentUser={currentUser}
                                    navigation={navigation}
                                    darkMode={darkMode}
                                    theme={theme}
                                    themedStyles={themedStyles}
                                    handleReply={handleReply}
                                    handleDeleteComment={handleDeleteComment}
                                    openModal={openModal}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
});

export type PostCommentSectionRef = {
    focusComposer: () => void;
};

const PostCommentSection = forwardRef<PostCommentSectionRef, Props>(
    ({ postId, postOwnerId, onComposerFocus }, ref) => {
        const navigation = useNavigation<any>();
        const { user: currentUser } = useUser();
        const { openModal } = useImageFullModal();
        const { addComment, deleteComment, subscribeComments } = usePostVM();

        const commentsScrollRef = useRef<ScrollView>(null);
        const commentInputRef = useRef<TextInput>(null);

        const { darkMode } = useUser();
        const theme = useMemo(() => ({
            bg: darkMode ? '#1E293B' : '#faf8ff', // matches surface bg
            text: darkMode ? '#F8FAFC' : '#191b24', // on-surface
            textMuted: darkMode ? '#94A3B8' : '#5c5f61', // secondary
            border: darkMode ? '#334155' : '#c2c6d8', // outline-variant
            input: darkMode ? '#334155' : '#F3F4F6',
            bubble: darkMode ? '#334155' : '#e0e3e6', // secondary-container
        }), [darkMode]);

        const themedStyles = useMemo(() => StyleSheet.create({
            wrapper: {
                borderColor: theme.border,
            },
            optionMenu: {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                borderWidth: darkMode ? 1 : 0.5,
            },
            commentBubble: {
                backgroundColor: theme.bubble,
            },
            inputBox: {
                backgroundColor: theme.input,
                borderColor: theme.border,
                borderWidth: 0.5,
            }
        }), [theme, darkMode]);

        const [comments, setComments] = useState<any[]>([]);
        const [newComment, setNewComment] = useState('');
        const [selectedImage, setSelectedImage] = useState<string | null>(null);
        const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
        const [expanded, setExpanded] = useState(false);
        const [sortMode, setSortMode] = useState<'top' | 'newest' | 'all'>('top');
        const [showFilterMenu, setShowFilterMenu] = useState(false);

        const handlePickImage = async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedImage(result.assets[0].uri);
            }
        };

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
            if ((!newComment.trim() && !selectedImage) || !currentUser) return;

            try {
                const content = newComment;
                const parentComment = replyTarget?.id
                    ? findCommentById(comments, replyTarget.id)
                    : null;
                const parentCommentOwnerId = parentComment?.user?.studentId;
                const img = selectedImage;

                setNewComment('');
                setSelectedImage(null);
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
                    parentCommentOwnerId,
                    img
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

        return (
            <View style={[styles.wrapper, themedStyles.wrapper, { backgroundColor: theme.bg }]}>
                <View style={styles.filterRow}>
                    <View style={{ position: 'relative' }}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.filterChip,
                                {
                                    backgroundColor: theme.bubble,
                                    transform: [{ scale: pressed ? 0.98 : 1 }]
                                }
                            ]}
                            onPress={() => setShowFilterMenu((prev) => !prev)}
                        >
                            <Text style={[styles.filterChipText, { color: theme.text }]}>{filterLabel}</Text>
                            <Ionicons
                                name={showFilterMenu ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color={theme.textMuted}
                            />
                        </Pressable>

                        {showFilterMenu && (
                            <>
                                <Pressable
                                    style={styles.optionOverlay}
                                    onPress={() => setShowFilterMenu(false)}
                                />

                                <View style={[styles.optionMenu, themedStyles.optionMenu]}>
                                    {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                                        <Pressable
                                            key={key}
                                            style={({ pressed }) => [
                                                styles.optionItem,
                                                { backgroundColor: pressed ? (darkMode ? '#33415550' : '#F1F5F9') : 'transparent' }
                                            ]}
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
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>

                    {comments.length > 5 && (
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                            onPress={() => setExpanded((prev) => !prev)}
                        >
                            <Text style={styles.expandText}>
                                {expanded ? 'Ẩn bớt' : 'Xem thêm'}
                            </Text>
                        </Pressable>
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
                                    <CommentNode
                                        item={item}
                                        currentUser={currentUser}
                                        navigation={navigation}
                                        darkMode={darkMode}
                                        theme={theme}
                                        themedStyles={themedStyles}
                                        handleReply={handleReply}
                                        handleDeleteComment={handleDeleteComment}
                                        openModal={openModal}
                                    />
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

                        <Pressable
                            onPress={() => setReplyTarget(null)}
                            style={({ pressed }) => [styles.replyCloseBtn, { opacity: pressed ? 0.8 : 1 }]}
                        >
                            <Ionicons name="close" size={12} color="#fff" />
                        </Pressable>
                    </View>
                )}

                <View style={styles.inputOuter}>
                    {selectedImage && (
                        <View style={[styles.commentImagePreviewWrap, { borderColor: theme.border }]}>
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.commentImagePreview}
                                contentFit="cover"
                            />
                            <Pressable
                                style={styles.closePreviewBtn}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Ionicons name="close" size={12} color="#fff" />
                            </Pressable>
                        </View>
                    )}

                    <View style={[styles.inputBox, themedStyles.inputBox]}>
                        <TextInput
                            ref={commentInputRef}
                            autoFocus={true}
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

                        <Pressable
                            onPress={handlePickImage}
                            style={({ pressed }) => [
                                styles.cameraBtn,
                                { transform: [{ scale: pressed ? 0.95 : 1 }] }
                            ]}
                        >
                            <Ionicons name="camera-outline" size={22} color={theme.textMuted} />
                        </Pressable>

                        <Pressable
                            onPress={handleAddComment}
                            style={({ pressed }) => [
                                styles.sendBtn,
                                {
                                    opacity: (newComment.trim() || selectedImage) ? 1 : 0.5,
                                    transform: [{ scale: pressed ? 0.95 : 1 }]
                                },
                            ]}
                            disabled={!newComment.trim() && !selectedImage}
                        >
                            <Ionicons name="send" size={14} color="#fff" />
                        </Pressable>
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
        borderRadius: 12,
        borderCurve: 'continuous',
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 4,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
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
        borderRadius: 10,
        borderCurve: 'continuous',
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
        // marginTop: 4,
        padding: 8,
        marginHorizontal: -12,
        borderTopWidth: 0.5,
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
    },
    avatarWrapper: {
        borderRadius: 20,
        borderCurve: 'continuous',
        borderWidth: 1,
        padding: 1.5,
        marginRight: 8,
        marginTop: 2,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarNested: {
        width: 28,
        height: 28,
        borderRadius: 14,
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
        borderRadius: 12,
        borderCurve: 'continuous',
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
        fontWeight: '700',
        color: Colors.subText,
        marginRight: 16,
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
        borderRadius: 14,
        borderCurve: 'continuous',
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
    commentImageContainer: {
        marginTop: 6,
        alignSelf: 'flex-start',
        borderRadius: 8,
        borderCurve: 'continuous',
        overflow: 'hidden',
        borderWidth: 0.5,
    },
    commentImage: {
        width: 140,
        height: 140,
        backgroundColor: '#F1F5F9',
    },
    commentImagePreviewWrap: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        borderRadius: 8,
        borderCurve: 'continuous',
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 8,
        position: 'relative',
    },
    commentImagePreview: {
        width: 80,
        height: 80,
        backgroundColor: '#F1F5F9',
    },
    closePreviewBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    cameraBtn: {
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
});

export default PostCommentSection;
