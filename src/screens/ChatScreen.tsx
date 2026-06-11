// ChatTab.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    TextInput,
    Platform,
    Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { formatTime } from '../utils/date';
import { useAlert } from '../contexts/AlertContext';
import { useUser } from '../contexts/UserContext';
import { Colors } from '../utils/theme';
import BottomActionSheet from '../components/BottomActionSheet';
import { useConversationVM } from 'viewmodels/useConversationVM';
import { Conversation } from 'types/chat.types';
import { SCREENS } from 'configs/constants';
import SimpleHeader from '../components/SimpleHeader';
import { useFriendVM } from 'viewmodels/useFriendVM';
import { userRepo } from 'repositories/userRepo';

const getShortName = (name: string) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    return words.length > 2 ? words.slice(-2).join(' ') : name;
};



type Props = {
    navigation: any;
};

export const ChatScreen = ({ navigation }: Props) => {
    const { user, darkMode } = useUser();
    const {
        conversations,
        loadConversations,
        markConversationSeen,
        markConversationAsUnread,
        removeConversation,
        loading,
    } = useConversationVM(user?.studentId);

    const { friendIds, listenFriends } = useFriendVM();
    const [friends, setFriends] = useState<any[]>([]);

    useEffect(() => {
        if (!user?.studentId) return;
        const unsub = listenFriends(user.studentId);
        return () => unsub?.();
    }, [user?.studentId, listenFriends]);

    useEffect(() => {
        let mounted = true;
        const loadFriends = async () => {
            if (friendIds.length === 0) {
                if (mounted) setFriends([]);
                return;
            }
            try {
                const profiles = await userRepo.getUsersByIds(friendIds);
                if (mounted) setFriends(profiles);
            } catch (error) {
                console.error("Error loading friends:", error);
            }
        };
        loadFriends();
        return () => { mounted = false; };
    }, [friendIds]);

    const [selectedItem, setSelectedItem] = useState<Conversation | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!user?.studentId) return;
        loadConversations();
    }, [user?.studentId, loadConversations]);

    const onRefresh = async () => {
        if (!user?.studentId) return;
        await loadConversations();
    };

    const theme = useMemo(() => ({
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : Colors.text,
        textSecondary: darkMode ? '#94A3B8' : '#888',
        border: darkMode ? '#334155' : '#E2E8F0',
        searchBg: darkMode ? '#1E293B' : '#F1F5F9',
        primary: Colors.primary,
        activeGreen: '#22C55E',
    }), [darkMode]);

    // Live conversation filtering based on search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        return conversations.filter(item =>
            item.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

    const handleDeleteConversation = async (item: Conversation) => {
        const success = await removeConversation(item.id);
        if (!success) {
            showAlert({
                type: "info",
                title: "Thông báo",
                message: "Xóa thất bại",
            });
            return;
        }
        setModalVisible(false);
        showAlert({
            type: "success",
            title: "Thành công",
            message: "Đã xóa hội thoại.",
        });
    };

    const handleOpenConversation = async (item: Conversation) => {
        await markConversationSeen(item.id);
        navigation.navigate("ChatDetailScreen", {
            user: item.user,
            conversationId: item.id,
        });
    };

    const handleOpenFriendChat = (friend: any) => {
        navigation.navigate("ChatDetailScreen", {
            user: friend,
        });
    };

    const chatActions = useMemo(() => {
        if (!selectedItem) return [];

        return [
            {
                label: "Xem trang cá nhân",
                icon: "person-outline" as any,
                onPress: () => {
                    navigation.navigate(SCREENS.DASHBOARD, {
                        screen: SCREENS.PROFILE_FEED,
                        params: { studentId: selectedItem.user.studentId },
                    });
                },
            },
            {
                label: "Lưu trữ",
                icon: "archive" as any,
                onPress: () => console.log("Archive"),
            },
            {
                label: "Tắt thông báo",
                icon: "notifications-off" as any,
                onPress: () => console.log("Mute"),
            },
            {
                label: selectedItem.hasUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc",
                icon: (selectedItem.hasUnread ? "mark-email-read" : "mark-email-unread") as any,
                onPress: () => {
                    if (selectedItem.hasUnread) {
                        markConversationSeen(selectedItem.id);
                    } else {
                        markConversationAsUnread(selectedItem.id);
                    }
                },
            },
            {
                label: "Hạn chế",
                icon: "person-off" as any,
                onPress: () => console.log("Restrict"),
            },
            {
                label: "Chặn",
                icon: "block" as any,
                color: "#FF3B30",
                onPress: () => console.log("Block"),
            },
            {
                label: "Xóa cuộc trò chuyện",
                icon: "delete-outline" as any,
                color: "#FF3B30",
                onPress: () => handleDeleteConversation(selectedItem),
            },
        ];
    }, [selectedItem, navigation, markConversationSeen, markConversationAsUnread, handleDeleteConversation]);

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader title="Tin nhắn" showBackButton={false} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
            >
                {/* Modern search input wrapper */}
                <View style={styles.searchSection}>
                    <View style={[styles.searchBar, { backgroundColor: theme.searchBg, borderColor: theme.border, borderWidth: 1 }]}>
                        <Feather name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Tìm kiếm"
                            placeholderTextColor={theme.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Horizontal Active Status Bar */}
                {/* <View style={styles.activeSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScroll}
                    >
                        <TouchableOpacity
                            activeOpacity={0.95}
                            style={styles.statusTile}
                            onPress={() => navigation.navigate(SCREENS.CREATE_NOTE)}
                        >
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User') }}
                                    style={styles.statusAvatar}
                                />
                                {user?.note ? (
                                    <View style={[styles.noteBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                        <Text numberOfLines={1} style={[styles.noteBubbleText, { color: theme.text }]}>{user.note}</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.addNoteBadge, { backgroundColor: theme.searchBg, borderColor: theme.card }]}>
                                        <Ionicons name="add" size={14} color={theme.text} />
                                    </View>
                                )}
                            </View>
                            <Text numberOfLines={1} style={[styles.statusName, { color: theme.text }]}>Ghi chú</Text>
                        </TouchableOpacity>

                        {friends.map((friend, idx) => (
                            <TouchableOpacity
                                activeOpacity={0.95}
                                key={friend.studentId || idx}
                                style={styles.statusTile}
                                onPress={() => handleOpenFriendChat(friend)}
                            >
                                <View style={styles.avatarWrapper}>
                                    <Image source={{ uri: friend.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(friend.name) }} style={styles.statusAvatar} />
                                    {friend.note && (
                                        <View style={[styles.noteBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                            <Text numberOfLines={1} style={[styles.noteBubbleText, { color: theme.text }]}>{friend.note}</Text>
                                        </View>
                                    )}
                                    {friend.online && (
                                        <View style={[styles.activeIndicator, { backgroundColor: theme.activeGreen, borderColor: theme.card }]} />
                                    )}
                                </View>
                                <Text numberOfLines={1} style={[styles.statusName, { color: theme.text }]}>{getShortName(friend.name)}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View> */}

                {/* Vertical Chats List */}
                <View style={styles.chatListSection}>
                    {filteredConversations.map((item) => {
                        const isUnread = item.hasUnread;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.chatItem]}
                                onPress={() => handleOpenConversation(item)}
                                onLongPress={() => {
                                    setSelectedItem(item);
                                    setModalVisible(true);
                                }}
                                delayLongPress={250}
                                activeOpacity={0.9}
                            >
                                <View style={styles.avatarWrapper}>
                                    <Image source={{ uri: item.user.avatar ?? '' }} style={styles.chatAvatar} />
                                    {item.user.online && (
                                        <View style={[styles.activeIndicator, { backgroundColor: theme.activeGreen, borderColor: theme.card }]} />
                                    )}
                                </View>

                                <View style={[styles.chatContent, { borderBottomColor: theme.border }]}>
                                    <View style={styles.chatMetaRow}>
                                        <Text numberOfLines={1} style={[styles.chatName, { color: theme.text, fontWeight: isUnread ? '700' : '600' }]}>
                                            {item.user.name}
                                        </Text>
                                        <Text style={[styles.chatTime, { color: isUnread ? theme.primary : theme.textSecondary, fontWeight: isUnread ? '700' : '400' }]}>
                                            {formatTime(item.timestamp)}
                                        </Text>
                                    </View>

                                    <View style={styles.chatMessageRow}>
                                        <Text
                                            numberOfLines={1}
                                            style={[
                                                styles.chatMessage,
                                                {
                                                    color: isUnread ? theme.text : theme.textSecondary,
                                                    fontWeight: isUnread ? '700' : '400',
                                                }
                                            ]}
                                        >
                                            {item.lastMessageSenderId === user?.studentId
                                                ? `Bạn: ${item.lastMessage}`
                                                : item.lastMessage}
                                        </Text>

                                        {isUnread ? (
                                            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]} />
                                        ) : (
                                            <MaterialIcons
                                                name={item.lastMessageSenderId === user?.studentId ? "check-circle" : "check"}
                                                size={14}
                                                color={theme.textSecondary}
                                                style={styles.messageStateIcon}
                                            />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Dynamic Facebook-styled Empty States */}
                    {filteredConversations.length === 0 && (
                        <ListEmptyComponent
                            navigation={navigation}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                        />
                    )}
                </View>
            </ScrollView>

            <BottomActionSheet
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                title={selectedItem?.user?.name || "Tuỳ chọn"}
                actions={chatActions}
            />


        </View>
    );
};

const ListEmptyComponent = ({
    navigation,
    searchQuery,
    setSearchQuery
}: {
    navigation: any;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}) => {
    const { darkMode } = useUser();
    const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

    const theme = {
        cardBg: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#191B24',
        textMuted: darkMode ? '#94A3B8' : '#5C5F61',
        border: darkMode ? '#334155' : '#E1E2EE',
        buttonPrimary: '#0866ff',
        buttonSecondary: darkMode ? '#334155' : '#e0e3e6',
        textSecondaryBtn: darkMode ? '#F8FAFC' : '#191C1E',
    };

    if (searchQuery.length > 0) {
        return (
            <View style={[styles.fbEmptyContainer, { paddingHorizontal: 16, paddingTop: 20 }]}>
                {/* 3D magnifying character card */}
                <View style={[styles.fbCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                    <View style={styles.fbImageWrapper}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKxHJNS8l6fvcndkWH8ZE0TaFu0MoHVB7zQhiWhmdeW_qt9WKGgqEFAAWt7ohk22PltPrRkCYJuT8KUe5eYt-E2VN7LXHvsLMVGfQCqIQg9Y4CvE06MzeitpjZNqWd6-u2VpqxII2r9cNgyau3bbQhBQ79QosRZnyY2F7d4BPpOeg7_LG44dRzYdmR3mCha6wWXIS4YDAVjPotQavBGu9R5aDqQ9Sg83gturHPTLQ1JdFcoZz90u5njhewVkbWknikSSpEjin7CPgt' }}
                            style={styles.fbIllustration}
                            resizeMode="cover"
                        />
                    </View>

                    <Text style={[styles.fbTitle, { color: theme.text }]}>Không tìm thấy kết quả phù hợp</Text>
                    <Text style={[styles.fbDescription, { color: theme.textMuted }]}>
                        Chúng tôi không tìm thấy tài khoản nào khớp với tìm kiếm của bạn. Hãy thử kiểm tra lại chính tả hoặc sử dụng tên khác.
                    </Text>

                    <View style={styles.fbButtonGroup}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setSearchQuery('')}
                            style={[styles.fbBtnPrimary, { backgroundColor: theme.buttonPrimary }]}
                        >
                            <Text style={styles.fbBtnTextPrimary}>Xóa nội dung tìm kiếm</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(SCREENS.HOME)}
                            style={[styles.fbBtnSecondary, { backgroundColor: theme.buttonSecondary }]}
                        >
                            <Text style={[styles.fbBtnTextSecondary, { color: theme.textSecondaryBtn }]}>Về trang chủ</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Suggestions panel */}
                <View style={styles.suggestionsContainer}>
                    <Text style={[styles.suggestionsLabel, { color: theme.textMuted }]}>Gợi ý cho bạn</Text>
                    <View style={[styles.suggestionsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                        <TouchableOpacity style={[styles.suggestionRow, { borderBottomColor: theme.border }]}>
                            <MaterialIcons name="history" size={22} color="#0050cd" />
                            <Text style={[styles.suggestionText, { color: theme.text }]}>Xem lại lịch sử tìm kiếm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.suggestionRow}>
                            <MaterialIcons name="help" size={22} color="#0050cd" />
                            <Text style={[styles.suggestionText, { color: theme.text }]}>Trung tâm trợ giúp</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View
            style={{
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 40,
            }}
        >
            <View
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setImageLayout({ width, height });
                }}
                style={{ width: "100%", alignItems: "center" }}
            >
                <Image
                    source={require("./../../assets/not_found.png")}
                    style={{ width: "100%", height: undefined, aspectRatio: 1 }}
                    resizeMode="contain"
                />

                {imageLayout.width > 0 && (
                    <TouchableOpacity
                        onPress={() =>
                            navigation.getParent()?.navigate("Dashboard", {
                                screen: "FriendsNearbyScreen",
                            })
                        }
                        style={{
                            position: "absolute",
                            top: imageLayout.height * 0.73,
                            left: imageLayout.width * 0.27,
                            width: imageLayout.width * 0.46,
                            height: imageLayout.height * 0.1,
                            opacity: 1,
                            borderRadius: 20,
                            backgroundColor: "transparent",
                        }}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchSection: {
        paddingHorizontal: 14,
        paddingTop: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        padding: 0,
        fontWeight: '500',
    },
    activeSection: {
    },
    horizontalScroll: {
        paddingHorizontal: 10,
        paddingTop: 12,
        gap: 12,
    },
    statusTile: {
        alignItems: 'center',
        width: 68,
        gap: 6,
    },
    noteIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
    },
    statusAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2.5,
    },
    addNoteBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteBubble: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        maxWidth: 70,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    noteBubbleText: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    statusName: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        width: '100%',
    },
    chatListSection: {
        // marginTop: 8,
        paddingBottom: 24,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        alignItems: 'center',
        height: 76,
    },
    chatAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    chatContent: {
        flex: 1,
        height: '100%',
        marginLeft: 12,
        justifyContent: 'center',
        borderBottomWidth: 1,
    },
    chatMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    chatName: {
        fontSize: 16,
        maxWidth: '75%',
    },
    chatTime: {
        fontSize: 12,
    },
    chatMessageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    chatMessage: {
        fontSize: 14,
        maxWidth: '85%',
    },
    unreadBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    messageStateIcon: {
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
        marginHorizontal: 16,
        marginTop: 32,
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            }
        })
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    emptyActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
    },
    emptyActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    fbEmptyContainer: {
        width: '100%',
        alignItems: 'center',
    },
    fbCard: {
        width: '100%',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            }
        })
    },
    fbImageWrapper: {
        width: 180,
        height: 180,
        borderRadius: 90,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    fbIllustration: {
        width: '100%',
        height: '100%',
        borderRadius: 90,
    },
    fbTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
    },
    fbDescription: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    fbButtonGroup: {
        width: '100%',
        gap: 10,
    },
    fbBtnPrimary: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fbBtnTextPrimary: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    fbBtnSecondary: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fbBtnTextSecondary: {
        fontSize: 14,
        fontWeight: '700',
    },
    suggestionsContainer: {
        width: '100%',
        marginTop: 24,
        paddingBottom: 40,
    },
    suggestionsLabel: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        paddingLeft: 4,
    },
    suggestionsCard: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
    },
    suggestionText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
