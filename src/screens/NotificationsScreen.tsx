import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowCounterClockwise, Bell, BellRinging, ChatCircleText, Check, Cpu, FunnelSimple, Heart, Lightning, MagnifyingGlass, ShareNetwork, UserCheck, UserCircle, UserPlus, UsersThree, X } from 'phosphor-react-native';
import { Portal, Snackbar } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { useUser } from '../contexts/UserContext';
import { formatTimeAgo } from '../utils/date';
import { useRefresh } from '../contexts/RefreshContext';
import * as RootNavigation from '../navigation/RootNavigation';
import { useFriendVM } from 'viewmodels/useFriendVM';
import { useNotificationVM } from 'viewmodels/useNotificationVM';
import { NotificationModel } from 'models/notification';
import { userRepo } from 'repositories/userRepo';
import BottomActionSheet, { BottomAction } from '../components/BottomActionSheet';

type ReadFilter = 'all' | 'unread' | 'read';
type CategoryFilter = 'all' | 'system' | 'friends' | 'activity';

type FilterChipProps = {
    label: string;
    active: boolean;
    onPress: () => void;
    compact?: boolean;
};

const FRIEND_TYPES = ['friend_request', 'friend_accept', 'follow'];
const ACTIVITY_TYPES = ['comment', 'share', 'post_reaction', 'comment_reaction'];

export default function NotificationsScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationModel | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [readFilter, setReadFilter] = useState<ReadFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [visibleCount, setVisibleCount] = useState(15);
    const { darkMode } = useUser();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const theme = {
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#0F172A',
        textSecondary: darkMode ? '#94A3B8' : '#64748B',
        textMuted: darkMode ? '#64748B' : '#94A3B8',
        border: darkMode ? '#475569' : '#E2E8F0',
        input: darkMode ? '#1E293B' : '#F1F5F9',
        badge: darkMode ? '#1E293B' : '#FFFFFF',
        unreadCard: darkMode ? '#334678ff' : '#E0F2FE',
        filterChip: darkMode ? '#334155' : '#FFFFFF',
        filterActive: Colors.primary,
        typeLabel: darkMode ? Colors.primary : '#6366F1',
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const {
        notifications,
        listenNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotificationVM();

    const { accept, reject } = useFriendVM();
    const { user } = useUser();
    const { register } = useRefresh();

    useEffect(() => {
        if (!user?.studentId) return;
        const unsub = listenNotifications(user.studentId);
        return () => unsub?.();
    }, [user?.studentId]);

    const reload = async () => { };

    useEffect(() => {
        return register(reload);
    }, []);

    const unreadCount = useMemo(
        () => notifications.reduce((sum, item) => sum + (item.unreadCount > 0 ? 1 : 0), 0),
        [notifications]
    );

    const filteredNotifications = useMemo(() => {
        const keyword = debouncedSearchQuery.trim().toLowerCase();
        return notifications.filter((item) => {
            const isUnread = item.unreadCount > 0;
            const matchesReadFilter =
                readFilter === 'all'
                    ? true
                    : readFilter === 'unread'
                        ? isUnread
                        : !isUnread;
            const matchesCategory =
                categoryFilter === 'all'
                    ? true
                    : categoryFilter === 'system'
                        ? item.type === 'system'
                        : categoryFilter === 'friends'
                            ? FRIEND_TYPES.includes(item.type)
                            : ACTIVITY_TYPES.includes(item.type);
            const haystack = `${item.title} ${item.body} ${item.type}`.toLowerCase();
            const matchesSearch = keyword.length === 0 || haystack.includes(keyword);
            return matchesReadFilter && matchesCategory && matchesSearch;
        });
    }, [categoryFilter, notifications, readFilter, debouncedSearchQuery]);

    const displayedNotifications = useMemo(() => {
        return filteredNotifications.slice(0, visibleCount);
    }, [filteredNotifications, visibleCount]);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(15);
    }, [readFilter, categoryFilter, debouncedSearchQuery]);

    const handleMarkAllRead = async () => {
        if (!user?.studentId || unreadCount === 0) return;
        await markAllAsRead(user.studentId);
        setSnackbarVisible(true);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setReadFilter('all');
        setCategoryFilter('all');
    };

    const hasActiveFilters =
        debouncedSearchQuery.trim().length > 0 || readFilter !== 'all' || categoryFilter !== 'all';

    const actions: BottomAction[] = [
        { label: 'Đánh dấu tất cả là đã đọc', onPress: handleMarkAllRead, icon: 'done-all' },
        { label: 'Cài đặt thông báo', onPress: () => { }, icon: 'settings' },
    ];

    const renderItem = ({ item }: { item: NotificationModel }) => {
        const isUnread = item.unreadCount > 0;

        if (item.type === 'friend_request') {
            return <FriendRequestItem item={item as NotificationModel<'friend_request'>} />;
        }

        const getIconBadge = () => {
            const iconProps = { size: 14, color: '#FFF', weight: "fill" as any };
            switch (item.type) {
                case 'system': return { icon: <Cpu {...iconProps} />, bg: '#06B6D4', largeIcon: <Cpu size={32} color={theme.textSecondary} /> };
                case 'friend_accept': return { icon: <UserCheck {...iconProps} />, bg: '#10B981', largeIcon: <UserCheck size={32} color={theme.textSecondary} /> };
                case 'follow': return { icon: <UserPlus {...iconProps} />, bg: '#8B5CF6', largeIcon: <UserCircle size={32} color={theme.textSecondary} /> };
                case 'comment': return { icon: <ChatCircleText {...iconProps} />, bg: '#6366F1', largeIcon: <ChatCircleText size={32} color={theme.textSecondary} /> };
                case 'share': return { icon: <ShareNetwork {...iconProps} />, bg: '#F59E0B', largeIcon: <ShareNetwork size={32} color={theme.textSecondary} /> };
                case 'post_reaction':
                case 'comment_reaction': return { icon: <Heart {...iconProps} />, bg: '#EF4444', largeIcon: <Heart size={32} color={theme.textSecondary} /> };
                default: return { icon: <Bell {...iconProps} />, bg: Colors.primary, largeIcon: <Bell size={32} color={theme.textSecondary} /> };
            }
        };

        const badgeInfo = getIconBadge();

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    setSelectedNotification(item);
                    setModalVisible(true);
                    if (isUnread && user?.studentId) {
                        markAsRead(user.studentId, item.id);
                    }
                }}
                style={[
                    styles.notificationRow,
                    { backgroundColor: isUnread ? theme.unreadCard : theme.bg, borderTopColor: theme.border }
                ]}
            >
                <View style={styles.avatarWrapperRow}>
                    <View style={[styles.largeIconCircle, { backgroundColor: theme.input }]}>
                        {badgeInfo.largeIcon}
                    </View>
                    <View style={[styles.typeBadgeSmall, { backgroundColor: badgeInfo.bg, borderColor: isUnread ? theme.unreadCard : theme.bg }]}>
                        {badgeInfo.icon}
                    </View>
                </View>

                <View style={styles.rowContent}>
                    <Text style={[styles.messageInline, { color: theme.text }]} numberOfLines={2}>
                        <Text style={[styles.title, { color: theme.text }]}>{item.title} </Text>
                        <Text style={{ color: theme.textSecondary }}>{item.body}</Text>
                    </Text>
                    <Text style={[styles.date, { color: isUnread ? Colors.primary : theme.textSecondary }]}>{formatTimeAgo(item.createdAt ?? '')}</Text>
                </View>

                {isUnread && (
                    <View style={styles.unreadDotWrapper}>
                        <View style={styles.unreadDot} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const FriendRequestItem = ({ item }: { item: NotificationModel<'friend_request'> }) => {
        const requesterId = item.data?.userId;
        const requestId = item.data?.requestId;
        const [requester, setRequester] = useState<any | null>(null);
        const isUnread = item.unreadCount > 0;

        useEffect(() => {
            if (!requesterId) return;
            const unsub = userRepo.listenUserById(requesterId, (data) => {
                setRequester(data);
            });
            return () => unsub?.();
        }, [requesterId]);

        const goToProfile = () => {
            if (!requesterId) return;
            RootNavigation.navigate('Dashboard', {
                screen: 'ProfileFeedScreen',
                params: { studentId: requesterId },
            });
        };

        const handleAccept = async () => {
            if (!requestId || !requesterId || !user?.studentId) return;
            await accept(requestId, user.studentId, requesterId, user.name);
            markAsRead(user.studentId, item.id);
        };

        const handleReject = async () => {
            if (!requestId || !requesterId || !user?.studentId) return;
            await reject(requestId, user.studentId, requesterId);
            markAsRead(user.studentId, item.id);
        };

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={goToProfile}
                style={[
                    styles.notificationRow,
                    { backgroundColor: isUnread ? theme.unreadCard : theme.bg, borderTopColor: theme.border }
                ]}
            >
                <View style={styles.avatarWrapperRow}>
                    <Image source={{ uri: requester?.avatar || 'https://via.placeholder.com/60' }} style={styles.avatarLarge} />
                    <View style={[styles.typeBadgeSmall, { backgroundColor: Colors.primary, borderColor: isUnread ? theme.unreadCard : theme.bg }]}>
                        <UserPlus size={12} color="#FFF" weight="fill" />
                    </View>
                </View>

                <View style={styles.rowContent}>
                    <View style={{ paddingRight: isUnread ? 24 : 0 }}>
                        <Text style={[styles.messageInline, { color: theme.text }]} numberOfLines={2}>
                            <Text style={[styles.title, { color: theme.text }]}>{item.title} </Text>
                            đã gửi cho bạn một lời mời kết bạn
                        </Text>
                        <Text style={[styles.date, { color: isUnread ? Colors.primary : theme.textSecondary }]}>{formatTimeAgo(item.createdAt ?? '')}</Text>
                    </View>

                    <View style={styles.inlineActionsRow}>
                        <TouchableOpacity style={[styles.inlineBtn, { backgroundColor: Colors.primary }]} onPress={handleAccept}>
                            <Text style={styles.inlineBtnTextPri}>Xác nhận</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.inlineBtn, { backgroundColor: theme.input }]} onPress={handleReject}>
                            <Text style={[styles.inlineBtnTextSec, { color: theme.text }]}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {isUnread && (
                    <View style={styles.unreadDotWrapper}>
                        <View style={styles.unreadDot} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderTopBar = () => {
        if (isSearching) {
            return (
                <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: Colors.primary, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
                    <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }} style={styles.topBarBackBtn}>
                        <Icon name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TextInput
                        autoFocus
                        placeholder="Tìm kiếm thông báo..."
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        underlineColorAndroid="transparent"
                        style={[styles.searchInputHeader, { color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.topBarClearBtn}>
                            <X size={20} color="rgba(255,255,255,0.8)" weight="bold" />
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        return (
            <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: Colors.primary, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
                <View style={styles.topBarLeft}>
                    <Text style={[styles.topBarTitle, { color: '#FFF' }]}>Thông báo</Text>
                </View>
                <View style={styles.topBarRight}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsSearching(true)}
                        style={[styles.topBarIconBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                    >
                        <MagnifyingGlass size={20} color="#FFF" weight="bold" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowOptions(true)}
                        style={[styles.topBarIconBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                    >
                        <Icon name="more-horiz" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderFilterChip = (label: string, icon: React.ReactNode, active: boolean, onPress: () => void) => (
        <TouchableOpacity
            style={[
                styles.newFilterChip,
                {
                    backgroundColor: active ? Colors.primary : (darkMode ? '#334155' : '#F8FAFC'),
                    borderColor: active ? Colors.primary : (darkMode ? '#475569' : '#E2E8F0')
                }
            ]}
            onPress={() => { onPress(); setShowOptions(false); }}
            activeOpacity={0.7}
        >
            {React.cloneElement(icon as React.ReactElement, { color: active ? '#FFF' : (darkMode ? '#94A3B8' : '#64748B') } as any)}
            <Text style={[styles.newFilterChipText, { color: active ? '#FFF' : theme.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderScrollableFilters = () => (
        <View style={styles.scrollableFilterContainer}>
            {/* Stats Card */}
            <View style={[styles.statsCard, { backgroundColor: darkMode ? '#334155' : '#F8FAFC' }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{notifications.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tổng</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: darkMode ? '#475569' : '#E2E8F0' }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#E11D48' }]}>{unreadCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Mới</Text>
                </View>
                {hasActiveFilters && (
                    <>
                        <View style={[styles.statDivider, { backgroundColor: darkMode ? '#475569' : '#E2E8F0' }]} />
                        <TouchableOpacity onPress={() => { clearFilters(); setShowOptions(false); }} style={styles.statItem} activeOpacity={0.7}>
                            <View style={[styles.clearFilterIcon, { backgroundColor: '#FFE4E6' }]}>
                                <X size={14} color="#E11D48" weight="bold" />
                            </View>
                            <Text style={[styles.statLabel, { color: '#E11D48', marginTop: 4 }]}>Bỏ lọc</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <Text style={[styles.sheetSectionTitle, { color: theme.textMuted }]}>Bộ lọc hiển thị</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipGroupCompact}>
                {renderFilterChip('Tất cả', <Bell size={14} weight={readFilter === 'all' && categoryFilter === 'all' ? "fill" : "bold"} />, readFilter === 'all' && categoryFilter === 'all', clearFilters)}
                {renderFilterChip('Mới', <BellRinging size={14} weight={readFilter === 'unread' ? "fill" : "bold"} />, readFilter === 'unread', () => setReadFilter('unread'))}
                {renderFilterChip('Hệ thống', <Cpu size={14} weight={categoryFilter === 'system' ? "fill" : "bold"} />, categoryFilter === 'system', () => setCategoryFilter('system'))}
                {renderFilterChip('Bạn bè', <UsersThree size={14} weight={categoryFilter === 'friends' ? "fill" : "bold"} />, categoryFilter === 'friends', () => setCategoryFilter('friends'))}
                {renderFilterChip('Khác', <Lightning size={14} weight={categoryFilter === 'activity' ? "fill" : "bold"} />, categoryFilter === 'activity', () => setCategoryFilter('activity'))}
            </ScrollView>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {renderTopBar()}

            <FlatList
                data={displayedNotifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={() => {
                    if (filtersVisible) {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setFiltersVisible(false);
                    }
                }}
                onEndReached={() => {
                    if (visibleCount < filteredNotifications.length) {
                        setVisibleCount(prev => prev + 10);
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    visibleCount < filteredNotifications.length ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <ActivityIndicator color={Colors.primary} size="small" />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }]}>
                            {notifications.length === 0 ? (
                                <Bell size={40} color={darkMode ? '#94A3B8' : '#64748B'} weight="duotone" />
                            ) : (
                                <MagnifyingGlass size={40} color={darkMode ? '#94A3B8' : '#64748B'} weight="duotone" />
                            )}
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            {notifications.length === 0 ? 'Chưa có thông báo nào' : 'Không có kết quả phù hợp'}
                        </Text>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            {notifications.length === 0 ? 'Khi có hoạt động mới, bạn sẽ thấy chúng ở đây.' : 'Thử đổi từ khóa tìm kiếm.'}
                        </Text>
                        {hasActiveFilters && (
                            <TouchableOpacity activeOpacity={0.8} onPress={clearFilters} style={styles.emptyResetBtn}>
                                <Text style={styles.emptyResetText}>Xóa tất cả bộ lọc</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            <BottomActionSheet
                visible={showOptions}
                onClose={() => setShowOptions(false)}
                title="Tùy chọn"
                actions={actions}
            >
                {renderScrollableFilters()}
            </BottomActionSheet>

            <Portal>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                    wrapperStyle={{ bottom: 65 }}
                    style={{
                        backgroundColor: darkMode ? '#334155' : Colors.primary,
                        borderRadius: 12,
                        marginHorizontal: 16,
                    }}
                    action={{ label: 'Đóng', onPress: () => setSnackbarVisible(false), textColor: '#fff' }}
                >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Đã đánh dấu tất cả là đã đọc</Text>
                </Snackbar>
            </Portal>

            <NotificationDetails
                visible={modalVisible}
                notification={selectedNotification}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const NotificationDetails = ({ visible, notification, onClose }: { visible: boolean; notification: NotificationModel | null; onClose: () => void }) => {
    const { darkMode } = useUser();
    if (!notification) return null;

    const isFriend = FRIEND_TYPES.includes(notification.type);
    const isActivity = ACTIVITY_TYPES.includes(notification.type);
    const isSystem = notification.type === 'system';

    const getThemeColor = () => {
        if (isSystem) return '#06B6D4'; // Cyan
        if (isFriend) return '#6366F1'; // Indigo
        if (isActivity) return '#F43F5E'; // Rose
        return Colors.primary;
    };

    const themeColor = getThemeColor();

    const getIcon = () => {
        const iconProps = { size: 32, color: '#FFF', weight: "duotone" as any };
        switch (notification.type) {
            case 'system': return <Cpu {...iconProps} />;
            case 'friend_accept': return <UserCheck {...iconProps} />;
            case 'follow': return <UserCircle {...iconProps} />;
            case 'comment': return <ChatCircleText {...iconProps} />;
            case 'share': return <ShareNetwork {...iconProps} />;
            case 'post_reaction':
            case 'comment_reaction': return <Heart {...iconProps} />;
            default: return <Bell {...iconProps} />;
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalContent, { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' }]}>
                            {/* Premium Header */}
                            <View style={[styles.modalPremiumHeader, { backgroundColor: Colors.primary }]} />

                            <View style={styles.modalBody}>
                                <View style={[styles.modalFloatingIcon, { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' }]}>
                                    <View style={[styles.modalIconInner, { backgroundColor: Colors.primary }]}>
                                        {getIcon()}
                                    </View>
                                </View>
                                <View style={styles.modalContentArea}>
                                    <Text style={[styles.modalTitle, { color: darkMode ? '#F8FAFC' : '#143D6B' }]}>
                                        {notification.title}
                                    </Text>

                                    <View style={styles.modalMetaRow}>
                                        <View style={[styles.modalTypeBadge, { backgroundColor: Colors.primary + '15' }]}>
                                            <Text style={[styles.modalTypeLabel, { color: Colors.primary }]}>
                                                {isSystem ? 'Hệ thống' : isFriend ? 'Bạn bè' : 'Hoạt động'}
                                            </Text>
                                        </View>
                                        <Text style={styles.modalDate}>{formatTimeAgo(notification.createdAt ?? '')}</Text>
                                    </View>

                                    <ScrollView style={styles.scrollBox} showsVerticalScrollIndicator={false} bounces={false}>
                                        <Text style={[styles.modalMessage, { color: darkMode ? '#CBD5E1' : '#4B5563' }]}>
                                            {notification.body}
                                        </Text>
                                    </ScrollView>

                                    <TouchableOpacity
                                        style={[styles.modalPrimaryBtn, { backgroundColor: Colors.primary }]}
                                        onPress={onClose}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={styles.modalPrimaryBtnText}>Đã hiểu</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topBarTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    topBarIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarBackBtn: {
        marginRight: 16,
    },
    topBarClearBtn: {
        marginLeft: 12,
    },
    searchInputHeader: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 15,
        fontWeight: '500',
    },
    scrollableFilterContainer: {
        paddingBottom: 12,
        paddingTop: 12,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: '80%',
    },
    clearFilterIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetSectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    chipGroupCompact: {
        flexDirection: 'row',
        paddingRight: 16,
    },
    newFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 8,
    },
    newFilterChipText: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 4,
    },
    filterWrapper: {
        paddingHorizontal: 16,
        zIndex: 10,
    },
    listContainer: {
        paddingHorizontal: 0,
        paddingBottom: 40,
    },
    notificationRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        alignItems: 'flex-start',
    },
    avatarWrapperRow: {
        position: 'relative',
        marginRight: 12,
        flexShrink: 0,
    },
    largeIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLarge: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    typeBadgeSmall: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowContent: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        marginRight: 8,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
    },
    messageInline: {
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 20,
        marginBottom: 2,
    },
    date: {
        fontSize: 13,
        fontWeight: '400',
        marginTop: 2,
    },
    unreadDotWrapper: {
        height: 60,
        justifyContent: 'center',
        paddingLeft: 4,
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -18,
    },
    unreadDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
    inlineActionsRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    inlineBtn: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineBtnTextPri: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    inlineBtnTextSec: {
        fontSize: 13,
        fontWeight: '600',
    },
    acceptText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    rejectText: { fontWeight: '700', fontSize: 13 },
    emptyState: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
    emptyIconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: '80%' },
    emptyResetBtn: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: Colors.primary + '15' },
    emptyResetText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
    modalContent: {
        borderRadius: 16,
        width: '85%',
        maxWidth: 360,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20
    },
    modalPremiumHeader: {
        height: 60,
        width: '100%',
    },
    modalBody: {
        paddingTop: 0,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    modalFloatingIcon: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: -34,
        padding: 4,
    },
    modalIconInner: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    modalContentArea: {
        marginTop: 8,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
        lineHeight: 26,
    },
    modalMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 15,
    },
    modalTypeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 8,
    },
    modalTypeLabel: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalDate: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8A94A6',
    },
    scrollBox: {
        maxHeight: 220,
        marginBottom: 18,
        width: '100%',
    },
    modalMessage: {
        lineHeight: 22,
        textAlign: 'center',
    },
    modalPrimaryBtn: {
        paddingVertical: 12,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    modalPrimaryBtnText: {
        color: '#FFFFFF',
        // fontSize: 16,
        fontWeight: '800',
    },
});
