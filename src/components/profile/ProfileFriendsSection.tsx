import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';

// Placeholder friend avatars using Dicebear (deterministic)
const PLACEHOLDER_SEEDS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'];
const getPlaceholderAvatar = (seed: string) =>
    `https://api.dicebear.com/7.x/thumbs/png?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

type ProfileFriendsSectionProps = {
    theme: any;
    darkMode: boolean;
    friendsCount: number;
    isCurrentUser: boolean;
    onViewAll?: () => void;
    friends?: any[];
    onPressFriend?: (studentId: string) => void;
};

export default function ProfileFriendsSection({
    theme,
    darkMode,
    friendsCount,
    isCurrentUser,
    onViewAll,
    friends = [],
    onPressFriend,
}: ProfileFriendsSectionProps) {
    const displayFriends = friends.slice(0, 6);
    const lastPress = React.useRef(0);

    const handlePress = (studentId: string) => {
        const now = Date.now();
        if (now - lastPress.current > 1000) {
            lastPress.current = now;
            onPressFriend?.(studentId);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: darkMode ? '#1E293B' : '#fff', borderTopWidth: 0.5, borderTopColor: theme.border, borderBottomWidth: 0.5, borderBottomColor: theme.border }]}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Bạn bè</Text>
                    <Text style={[styles.subCount, { color: theme.textMuted }]}>
                        {friendsCount.toLocaleString()} người bạn
                    </Text>
                </View>
                <Pressable onPress={onViewAll}>
                    <Text style={[styles.viewAll, { color: Colors.primary }]}>Xem tất cả</Text>
                </Pressable>
            </View>

            {/* 3x2 Avatar Grid */}
            {friendsCount > 0 ? (
                <View style={styles.grid}>
                    {displayFriends.map((friend, i) => (
                        <Pressable
                            key={friend.studentId || i}
                            style={({ pressed }) => [styles.friendItem, { opacity: pressed ? 0.95 : 1 }]}
                            onPress={() => friend.studentId && handlePress(friend.studentId)}
                        >
                            <Image
                                source={{ uri: friend.avatar || 'https://via.placeholder.com/150' }}
                                style={[styles.friendAvatar, { borderColor: theme.border }]}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                            <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={2}>
                                {friend.name || 'Người dùng'}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            ) : (
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    {isCurrentUser ? 'Bạn chưa có bạn bè nào.' : 'Chưa có bạn bè để hiển thị.'}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    subCount: {
        fontSize: 14,
        marginTop: 2,
    },
    viewAll: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    friendItem: {
        width: '31%',
    },
    friendAvatar: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
        borderWidth: 0.5,
        marginBottom: 4,
    },
    friendName: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        textAlign: 'center'
    },
    emptyText: {
        fontSize: 14,
        marginBottom: 14,
        lineHeight: 20,
    },
    viewAllBtn: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewAllBtnText: {
        fontSize: 15,
    },
});
