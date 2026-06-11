import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';
import { FriendRelationStatus } from '../../models/friend';

type ProfileHeaderProps = {
    isCurrentUser: boolean;
    studentName?: string | null;
    avatarUri?: string | null;
    coverUri: string;
    major?: string | null;
    friendsCount: number;
    followersCount: number;
    followingCount: number;
    displayStatus: FriendRelationStatus;
    config: any;
    darkMode: boolean;
    theme: any;
    openModal: (images: string[] | string, indexOrOptions?: number | any, optionsArg?: any) => void;
    handleChangeAvatar: () => void;
    handleChangeCover: () => void;
    handleAcceptFriend: () => void;
    handleRejectFriend: () => void;
    handleFriendPress: () => void;
    handleMessages: () => void;
    handleShowOptions?: () => void;
    handleAddFriend?: () => void;
    handleAddStory?: () => void;
    handleDeleteStory?: (index: number) => void;
    stories?: any[];
};

export default function ProfileHeader({
    isCurrentUser,
    studentName,
    avatarUri,
    coverUri,
    major,
    friendsCount,
    followersCount,
    followingCount,
    displayStatus,
    config,
    darkMode,
    theme,
    openModal,
    handleChangeAvatar,
    handleChangeCover,
    handleAcceptFriend,
    handleRejectFriend,
    handleFriendPress,
    handleMessages,
    handleShowOptions,
    handleAddFriend,
    handleAddStory,
    handleDeleteStory,
    stories = []
}: ProfileHeaderProps) {
    const secondaryBg = darkMode ? '#334155' : '#E4E6EB';
    const activeStories = (stories || []).filter((story: any) => {
        if (typeof story === 'string') return true; // keep old stories visible to avoid sudden disappearance
        const createdAt = story?.createdAt;
        if (createdAt) {
            const parsedTime = Date.parse(createdAt);
            if (!isNaN(parsedTime)) {
                const diff = Date.now() - parsedTime;
                return diff < 24 * 60 * 60 * 1000; // 24 hours
            }
            return true; // fallback if parse fails
        }
        return false;
    });
    const hasStories = activeStories.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]}>
            {/* ── Cover Photo ── */}
            <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
                onPress={() =>
                    openModal(coverUri, {
                        editableType: isCurrentUser ? 'cover' : undefined,
                        onRequestChange: isCurrentUser ? handleChangeCover : undefined,
                    })
                }
            >
                <Image
                    source={{ uri: coverUri }}
                    style={styles.cover}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                />
            </Pressable>

            {/* ── Avatar + Info Block ── */}
            <View style={styles.infoBlock}>
                {/* Floating Avatar — overlaps cover by 64px */}
                <View style={styles.avatarArea}>
                    <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
                        onPress={() => {
                            if (hasStories) {
                                // Nếu có story, bấm vào Avatar sẽ xem các ảnh story dạng FB slideshow
                                const urls = activeStories.map(s => typeof s === 'string' ? s : s.url);
                                const timestamps = activeStories.map(s => typeof s === 'string' ? undefined : s.createdAt);

                                const handleDeleteStoryWrapper = (activeIndex: number) => {
                                    if (!handleDeleteStory) return;
                                    const activeStory = activeStories[activeIndex];
                                    const realIndex = (stories || []).indexOf(activeStory);
                                    if (realIndex !== -1) {
                                        handleDeleteStory(realIndex);
                                    }
                                };

                                openModal(urls, 0, {
                                    isStory: true,
                                    userName: studentName,
                                    userAvatar: avatarUri,
                                    storyTimestamps: timestamps,
                                    onDeleteStory: isCurrentUser ? handleDeleteStoryWrapper : undefined
                                });
                            } else if (avatarUri) {
                                openModal(avatarUri, {
                                    editableType: isCurrentUser ? 'avatar' : undefined,
                                    onRequestChange: isCurrentUser ? handleChangeAvatar : undefined,
                                });
                            }
                        }}
                    >
                        <View
                            style={[
                                styles.avatarRing,
                                {
                                    borderColor: hasStories ? '#1877F2' : theme.card,
                                    backgroundColor: theme.card,
                                    borderWidth: hasStories ? 5 : 4,
                                }
                            ]}
                        >
                            <Image
                                source={{ uri: avatarUri || 'https://via.placeholder.com/150' }}
                                style={styles.avatar}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                        </View>
                    </Pressable>

                    {isCurrentUser && (
                        <Pressable
                            style={[styles.avatarCameraBtn, { backgroundColor: secondaryBg, borderColor: theme.card }]}
                            onPress={handleChangeAvatar}
                        >
                            <MaterialIcons name="photo-camera" size={20} color={theme.text} />
                        </Pressable>
                    )}
                </View>

                {/* Name + Bio */}
                <View style={styles.nameBlock}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.nameText, { color: theme.text }]} numberOfLines={1}>
                            {studentName}
                        </Text>
                        <MaterialIcons name="verified" size={20} color="#1D9BF0" style={{ marginLeft: 6 }} />
                    </View>

                    {major ? (
                        <Text style={[styles.bioText, { color: theme.textMuted }]} numberOfLines={2}>
                            {major}
                        </Text>
                    ) : null}

                    {/* Stats row (inline Threads/X style) */}
                    <View style={styles.statsRow}>
                        <Text style={{ fontSize: 14 }}>
                            <Text style={[styles.statNum, { color: theme.text }]}>{friendsCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}> bạn bè</Text>
                        </Text>
                        <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
                        <Text style={{ fontSize: 14 }}>
                            <Text style={[styles.statNum, { color: theme.text }]}>{followersCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}> người theo dõi</Text>
                        </Text>
                    </View>
                </View>

                {/* ── Action Buttons ── */}
                {isCurrentUser ? (
                    <View style={styles.actionRow}>
                        <Pressable
                            onPress={handleAddStory}
                            style={({ pressed }) => [
                                styles.btnPrimary,
                                { backgroundColor: Colors.primary, transform: [{ scale: pressed ? 0.97 : 1 }] }
                            ]}
                        >
                            <MaterialIcons name="add" size={18} color="#fff" />
                            <Text style={styles.btnPrimaryText}>Thêm vào tin</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.btnSecondary,
                                { backgroundColor: secondaryBg, transform: [{ scale: pressed ? 0.97 : 1 }] }
                            ]}
                        >
                            <MaterialIcons name="edit" size={18} color={theme.text} />
                            <Text style={[styles.btnSecondaryText, { color: theme.text }]}>Chỉnh sửa</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.btnIcon,
                                { backgroundColor: secondaryBg, transform: [{ scale: pressed ? 0.97 : 1 }] }
                            ]}
                            onPress={handleShowOptions}
                        >
                            <MaterialIcons name="more-horiz" size={22} color={theme.text} />
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.actionRow}>
                        {displayStatus === 'pending_received' ? (
                            <>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.btnPrimary,
                                        { backgroundColor: Colors.primary, transform: [{ scale: pressed ? 0.97 : 1 }] }
                                    ]}
                                    onPress={handleAcceptFriend}
                                >
                                    <MaterialIcons name="person-add" size={18} color="#fff" />
                                    <Text style={styles.btnPrimaryText}>Chấp nhận</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.btnSecondary,
                                        { backgroundColor: secondaryBg, transform: [{ scale: pressed ? 0.97 : 1 }] }
                                    ]}
                                    onPress={handleRejectFriend}
                                >
                                    <Text style={[styles.btnSecondaryText, { color: theme.text }]}>Từ chối</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.btnIcon,
                                        { backgroundColor: secondaryBg, transform: [{ scale: pressed ? 0.97 : 1 }] }
                                    ]}
                                    onPress={handleMessages}
                                >
                                    <MaterialIcons name="chat" size={20} color={theme.text} />
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Pressable
                                    disabled={displayStatus === 'unknown'}
                                    style={({ pressed }) => [
                                        styles.btnPrimary,
                                        {
                                            backgroundColor: config.bgColor === '#007AFF' ? Colors.primary : config.bgColor,
                                            opacity: displayStatus === 'unknown' ? 0.6 : 1,
                                            transform: [{ scale: pressed ? 0.97 : 1 }]
                                        }
                                    ]}
                                    onPress={
                                        config.action === 'add' ? handleAddFriend :
                                            config.action === 'cancel' ? handleFriendPress :
                                                handleShowOptions
                                    }
                                >
                                    {displayStatus === 'unknown' ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialIcons name={config.icon as any} size={18} color={config.iconColor} />
                                            <Text style={[styles.btnPrimaryText, { color: config.iconColor }]}>
                                                {config.label}
                                            </Text>
                                        </>
                                    )}
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.btnSecondary,
                                        { backgroundColor: secondaryBg, transform: [{ scale: pressed ? 0.97 : 1 }] }
                                    ]}
                                    onPress={handleMessages}
                                >
                                    <MaterialIcons name="chat" size={18} color={theme.text} />
                                    <Text style={[styles.btnSecondaryText, { color: theme.text }]}>Nhắn tin</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.btnIcon,
                                        { backgroundColor: secondaryBg, transform: [{ scale: pressed ? 0.97 : 1 }] }
                                    ]}
                                    onPress={handleShowOptions}
                                >
                                    <MaterialIcons name="more-horiz" size={22} color={theme.text} />
                                </Pressable>
                            </>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const AVATAR_SIZE = 152;
const COVER_HEIGHT = 192;
const AVATAR_OVERLAP = 84;

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },

    // ── Cover ──
    cover: {
        width: '100%',
        height: COVER_HEIGHT,
    },
    coverCameraBtn: {
        position: 'absolute',
        bottom: 10,
        right: 12,
        borderRadius: 8,
        padding: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Info block (sits below cover) ──
    infoBlock: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },

    // ── Avatar ──
    avatarArea: {
        marginTop: -AVATAR_OVERLAP,    // overlap into cover
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    avatarRing: {
        borderRadius: (AVATAR_SIZE + 8) / 2,
        borderWidth: 4,
        padding: 0,
        overflow: 'hidden',
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
    },
    avatarCameraBtn: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Name / Bio ──
    nameBlock: {
        marginTop: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameText: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
        flexShrink: 1,
    },
    bioText: {
        fontSize: 15,
        lineHeight: 22,
        marginTop: 4,
    },

    // ── Stats ──
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    statNum: {
        fontSize: 14,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '400',
    },
    dot: {
        marginHorizontal: 8,
        fontSize: 12,
    },

    // ── Action Buttons ──
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    btnPrimary: {
        flex: 1,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 8,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
            android: { elevation: 1 },
        }),
    },
    btnPrimaryText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    btnSecondary: {
        flex: 1,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 8,
    },
    btnSecondaryText: {
        fontSize: 13,
        fontWeight: '700',
    },
    btnIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
