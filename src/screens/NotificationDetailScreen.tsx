import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import {
    ArrowLeft,
    MagnifyingGlass,
    DotsThree,
    Users,
    Eye,
    ArrowUUpLeft,
    UserPlus,
    BellSlash,
    CaretRight,
    GlobeHemisphereWest,
    Cpu
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../contexts/UserContext';
import { NotificationStackParamList } from '../navigation/types';
import { Colors } from '../utils/theme';
import { formatTimeAgo } from '../utils/date';
import SimpleHeader from '../components/SimpleHeader';
import * as RootNavigation from '../navigation/RootNavigation';
import { userRepo } from '../repositories/userRepo';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { PostModel } from '../models/post';
import Skeleton from 'types/Skeleton';
import BottomActionSheet, { BottomAction } from '../components/BottomActionSheet';

type Props = NativeStackScreenProps<NotificationStackParamList, 'NotificationDetailScreen'>;

export default function NotificationDetailScreen({ route, navigation }: Props) {
    const { notification } = route.params;
    const { darkMode } = useUser();
    const insets = useSafeAreaInsets();

    const theme = {
        bg: darkMode ? '#0F172A' : '#F0F2F5',
        surface: darkMode ? '#1E293B' : '#faf8ff',
        surfaceLow: darkMode ? '#0F172A' : '#f2f3ff',
        surfaceHigh: darkMode ? '#334155' : '#e1e2ee',
        text: darkMode ? '#F8FAFC' : '#191b24',
        textSecondary: darkMode ? '#94A3B8' : '#5c5f61',
        textVariant: darkMode ? '#CBD5E1' : '#424656',
        primary: Colors.primary,
        primaryContainer: darkMode ? '#003FA5' : '#0866ff',
        onPrimary: '#FFFFFF',
        secondaryFixed: darkMode ? '#334155' : '#e0e3e6',
        border: darkMode ? '#475569' : '#c2c6d8',
        primaryFixed: darkMode ? '#1e3a8a' : '#dbe1ff',
    };

    const [sender, setSender] = useState<any>(null);
    const [post, setPost] = useState<any>(null);
    const [loadingSender, setLoadingSender] = useState(!!notification.senderId);
    const [loadingPost, setLoadingPost] = useState(!!(notification.data as any)?.postId);
    const [showOptions, setShowOptions] = useState(false);

    const notificationActions: BottomAction[] = [
        {
            label: 'Đánh dấu chưa đọc',
            icon: 'mark-email-unread',
            onPress: () => {
                // Implementation for marking as unread
            }
        },
        {
            label: 'Báo cáo bài viết',
            icon: 'report',
            onPress: () => {
                // Implementation for reporting
            }
        },
        {
            label: 'Tắt thông báo từ người này',
            icon: 'notifications-off',
            onPress: () => {
                // Implementation for muting
            }
        }
    ];

    useEffect(() => {
        if (notification.senderId) {
            setLoadingSender(true);
            const unsub = userRepo.listenUserById(notification.senderId, (data) => {
                setSender(data);
                setLoadingSender(false);
            });
            return () => unsub && unsub();
        } else {
            setLoadingSender(false);
        }
    }, [notification.senderId]);

    useEffect(() => {
        const fetchPost = async () => {
            const postId = (notification.data as any)?.postId;
            if (postId) {
                setLoadingPost(true);
                try {
                    const docSnap = await getDoc(doc(db, 'posts', postId));
                    if (docSnap.exists()) {
                        setPost(docSnap.data());
                    }
                } catch (e) {
                    console.log('Error fetching post:', e);
                } finally {
                    setLoadingPost(false);
                }
            } else {
                setLoadingPost(false);
            }
        };
        fetchPost();
    }, [notification.data]);

    const isLoading = loadingSender || loadingPost;

    const authorName = post?.user?.name || "Người dùng";
    const authorAvatar = post?.user?.avatar || "https://ui-avatars.com/api/?name=User&background=random";
    const postImage = post?.images?.[0]?.url || null;
    const userAvatar = sender?.avatar || "https://ui-avatars.com/api/?name=Sender&background=random";
    const senderName = sender?.name || "Ai đó";

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader
                title="Thông báo"
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Notification Detail Card */}
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    {isLoading ? (

                        <>
                            {/* User Header Skeleton */}
                            <View style={styles.userHeader}>
                                <View style={styles.avatarLarge}>
                                    <Skeleton width="100%" height="100%" radius={24} />
                                </View>
                                <View style={[styles.userHeaderContent, { justifyContent: 'center' }]}>
                                    <Skeleton width="70%" height={20} radius={4} style={{ marginBottom: 6 }} />
                                    <Skeleton width="40%" height={16} radius={4} />
                                </View>
                            </View>

                            {/* Preview Area Skeleton */}
                            <View style={[styles.previewArea, { backgroundColor: theme.surfaceLow, borderColor: theme.border }]}>
                                <View style={styles.previewHeader}>
                                    <View style={styles.avatarSmall}>
                                        <Skeleton width="100%" height="100%" radius={12} />
                                    </View>
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <Skeleton width="50%" height={16} radius={4} />
                                        <Skeleton width="25%" height={12} radius={4} />
                                    </View>
                                </View>
                                <View style={styles.previewBody}>
                                    <Skeleton width="40%" height={20} radius={4} style={{ marginBottom: 6 }} />
                                </View>
                                <View style={styles.postImage}>
                                    <Skeleton width="100%" height="100%" radius={8} />
                                </View>
                            </View>

                            {/* Actions Skeleton */}
                            <View style={styles.actionsContainer}>
                                <View style={[styles.primaryBtn, { backgroundColor: '#D1D9E0' }]}>
                                    <Skeleton width={120} height={18} radius={4} />
                                </View>
                                <View style={styles.secondaryActionsRow}>
                                    <View style={[styles.secondaryBtn, { backgroundColor: '#D1D9E0', flex: 1 }]}>
                                        <Skeleton width={80} height={18} radius={4} />
                                    </View>
                                    <View style={[styles.secondaryBtn, { backgroundColor: '#D1D9E0', paddingHorizontal: 16 }]}>
                                        <Skeleton width={24} height={18} radius={4} />
                                    </View>
                                </View>
                            </View>
                        </>
                    ) : notification.type === 'system' ? (
                        <View style={[styles.documentContainer, { backgroundColor: theme.surface }]}>
                            {/* Header Group */}
                            <View style={styles.documentHeader}>
                                <Text style={[styles.documentMeta, { color: theme.textSecondary }]}>
                                    Cập nhật lần cuối: {formatTimeAgo(notification.createdAt ?? '')}
                                </Text>
                                <Text style={[styles.documentTitle, { color: theme.text }]}>
                                    {notification.title}
                                </Text>
                            </View>

                            {/* Content Body */}
                            <View style={styles.documentBodyWrapper}>
                                <Text style={[styles.documentBody, { color: theme.text }]} selectable>
                                    {notification.body}
                                </Text>
                            </View>

                            {/* Subtle Support Note */}
                            <View style={[styles.documentInfoBox, { backgroundColor: theme.surfaceLow, borderColor: theme.border }]}>
                                <Cpu size={20} color={theme.primary} weight="duotone" />
                                <Text style={[styles.documentInfoText, { color: theme.textSecondary }]}>
                                    Nếu bạn có bất kỳ thắc mắc nào về thông báo này, vui lòng liên hệ với đội ngũ hỗ trợ qua mục "Trợ giúp".
                                </Text>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.documentActions}>
                                <TouchableOpacity
                                    style={[styles.documentPrimaryBtn, { backgroundColor: theme.primary }]}
                                    onPress={() => navigation.goBack()}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.documentPrimaryBtnText, { color: theme.onPrimary }]}>Tôi đã hiểu</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            {/* User Header */}
                            <View style={styles.userHeader}>
                                <TouchableOpacity activeOpacity={0.8} onPress={() => notification.senderId && RootNavigation.navigate("Dashboard", { screen: "ProfileFeedScreen", params: { studentId: notification.senderId } })}>
                                    <Image source={{ uri: userAvatar }} style={styles.avatarLarge} />
                                </TouchableOpacity>
                                <View style={styles.userHeaderContent}>
                                    <Text style={[styles.titleText, { color: theme.text }]}>
                                        <Text
                                            style={{ fontWeight: '700' }}
                                            onPress={() => notification.senderId && RootNavigation.navigate("Dashboard", { screen: "ProfileFeedScreen", params: { studentId: notification.senderId } })}
                                        >
                                            {senderName}
                                        </Text>
                                        <Text> {notification.title.replace(senderName, '').trim().toLowerCase()}</Text>
                                    </Text>
                                    <View style={styles.metaRow}>
                                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                                            {formatTimeAgo(notification.createdAt ?? '')}
                                        </Text>
                                        <Text style={[styles.metaDot, { color: theme.textSecondary }]}>•</Text>
                                        <Users size={14} color={theme.textSecondary} weight="fill" />
                                    </View>
                                </View>
                            </View>

                            {/* Preview Area */}
                            <View style={[styles.previewArea, { backgroundColor: theme.surfaceLow, borderColor: theme.border }]}>
                                <View style={styles.previewHeader}>
                                    <Image source={{ uri: authorAvatar }} style={styles.avatarSmall} />
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <Text style={[styles.previewAuthor, { color: theme.text }]}>{authorName}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                                {formatTimeAgo(post?.createdAt || notification.createdAt || '')}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: theme.textSecondary }}>•</Text>
                                            <GlobeHemisphereWest size={12} color={theme.textSecondary} weight="fill" />
                                        </View>
                                    </View>
                                </View>
                                <Text style={[styles.previewBody, { color: theme.textVariant }]} numberOfLines={3}>
                                    {post?.content || notification.body}
                                </Text>
                                {/* Optional post image placeholder */}
                                {postImage && <Image source={{ uri: postImage }} style={styles.postImage} contentFit="cover" />}
                            </View>

                            {/* Interaction Actions */}
                            <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        const postId = (notification.data as any)?.postId;
                                        if (postId) {
                                            navigation.navigate('PostDetailScreen', { postId });
                                        }
                                    }}
                                >
                                    <Eye size={20} color={theme.onPrimary} />
                                    <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>Xem bài viết</Text>
                                </TouchableOpacity>
                                <View style={styles.secondaryActionsRow}>
                                    <TouchableOpacity
                                        style={[styles.secondaryBtn, { backgroundColor: theme.primary, flex: 1 }]}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            const postId = (notification.data as any)?.postId;
                                            if (postId) {
                                                navigation.navigate('PostDetailScreen', { postId, focusComment: true });
                                            }
                                        }}
                                    >
                                        <ArrowUUpLeft size={20} color={theme.onPrimary} />
                                        <Text style={[styles.secondaryBtnText, { color: theme.onPrimary }]}>Phản hồi</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.secondaryBtn, { backgroundColor: theme.primary, paddingHorizontal: 16 }]}
                                        activeOpacity={0.8}
                                        onPress={() => setShowOptions(true)}
                                    >
                                        <DotsThree size={20} color={theme.onPrimary} weight="bold" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            <BottomActionSheet
                visible={showOptions}
                onClose={() => setShowOptions(false)}
                title="Tùy chọn thông báo"
                actions={notificationActions}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginLeft: 8,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    avatarLarge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#e1e1e1',
    },
    userHeaderContent: {
        flex: 1,
    },
    titleText: {
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    },
    metaDot: {
        fontSize: 10,
        marginHorizontal: 4,
    },
    previewArea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
        backgroundColor: '#e1e1e1',
    },
    previewAuthor: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    previewBody: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 8,
    },
    postImage: {
        width: '100%',
        height: 100,
        borderRadius: 8,
        backgroundColor: '#e1e1e1',
    },
    actionsContainer: {
        gap: 8,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
    },
    primaryBtnText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    secondaryActionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
    },
    secondaryBtnText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    suggestedSection: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    suggestedGrid: {
        gap: 8,
    },
    suggestedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    suggestedLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 12,
    },
    suggestedIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    suggestedTitle: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 24,
    },
    suggestedSub: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    },
    actionChip: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    documentContainer: {
        paddingTop: 8,
        paddingBottom: 8,
    },
    documentHeader: {
    },
    documentMeta: {
        fontSize: 12,
        fontWeight: '400',
        marginBottom: 4,
        letterSpacing: 0.2,
    },
    documentTitle: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        letterSpacing: -0.02,
    },
    documentBodyWrapper: {
        marginBottom: 16,
    },
    documentBody: {
        fontSize: 16,
        lineHeight: 26,
        fontWeight: '400',
    },
    documentInfoBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginBottom: 20,
        gap: 12,
        alignItems: 'flex-start',
    },
    documentInfoText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 20,
    },
    documentActions: {
        flexDirection: 'column',
        gap: 12,
    },
    documentPrimaryBtn: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    documentPrimaryBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
