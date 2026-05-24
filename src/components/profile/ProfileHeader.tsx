import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Pressable, Platform } from 'react-native';
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
    openModal: (uri: string, options?: any) => void;
    handleChangeAvatar: () => void;
    handleChangeCover: () => void;
    handleAcceptFriend: () => void;
    handleRejectFriend: () => void;
    handleFriendPress: () => void;
    handleMessages: () => void;
    handleShowOptions: () => void;
    handleAddFriend: () => void;
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
    handleAddFriend
}: ProfileHeaderProps) {
    return (
        <View style={styles.profile_container}>
            {/* Cover */}
            <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
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
                />
            </Pressable>

            {/* Header Content */}
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                {/* Avatar */}
                <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                    onPress={() =>
                        avatarUri
                            ? openModal(avatarUri, {
                                editableType: isCurrentUser ? 'avatar' : undefined,
                                onRequestChange: isCurrentUser ? handleChangeAvatar : undefined,
                            })
                            : undefined
                    }
                >
                    <Image
                        source={{ uri: avatarUri || '' }}
                        style={[styles.avatar_large, { borderColor: theme.card }]}
                    />
                </Pressable>

                <View style={styles.infoContainer}>
                    {/* Name & Verified Badge */}
                    <View style={styles.nameRow}>
                        <Text style={[styles.nameText, { color: theme.text }]}>{studentName}</Text>
                        <MaterialIcons name="verified" size={20} color="#1D9BF0" style={styles.verifiedBadge} />
                    </View>

                    {/* Major Text */}
                    <Text style={[styles.majorSubtitle, { color: theme.textMuted }]}>{major}</Text>

                    {/* Minimalist Stats Row */}
                    <View style={styles.statsBar}>
                        <View style={styles.statGroup}>
                            <Text style={[styles.statCount, { color: theme.text }]}>{friendsCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>bạn bè</Text>
                        </View>
                        <View style={[styles.dotSeparator, { backgroundColor: theme.border }]} />
                        <View style={styles.statGroup}>
                            <Text style={[styles.statCount, { color: theme.text }]}>{followersCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>người theo dõi</Text>
                        </View>
                        <View style={[styles.dotSeparator, { backgroundColor: theme.border }]} />
                        <View style={styles.statGroup}>
                            <Text style={[styles.statCount, { color: theme.text }]}>{followingCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>đang theo dõi</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons Row */}
                {!isCurrentUser && (
                    <View style={styles.actionRow}>
                        {displayStatus === 'pending_received' ? (
                            <View style={styles.dualButtonRow}>
                                <Pressable
                                    style={({ pressed }) => [styles.primaryBtn, { backgroundColor: Colors.primary, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                                    onPress={handleAcceptFriend}
                                >
                                    <MaterialIcons name="person-add" size={18} color="#fff" />
                                    <Text style={styles.primaryBtnText}>Chấp nhận</Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: darkMode ? '#334155' : '#F1F5F9', transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                                    onPress={handleRejectFriend}
                                >
                                    <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Từ chối</Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: darkMode ? '#334155' : '#F1F5F9', transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                                    onPress={handleMessages}
                                >
                                    <MaterialIcons name="chat" size={18} color={theme.textMuted} />
                                    <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Nhắn tin</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.dualButtonRow}>
                                <Pressable
                                    disabled={displayStatus === 'unknown'}
                                    style={({ pressed }) => [
                                        styles.primaryBtn,
                                        {
                                            backgroundColor: config.bgColor === '#007AFF' ? Colors.primary : config.bgColor,
                                            opacity: displayStatus === 'unknown' ? 0.6 : 1,
                                            transform: [{ scale: pressed ? 0.96 : 1 }]
                                        }
                                    ]}
                                    onPress={
                                        config.action === 'add' ? handleAddFriend :
                                            config.action === 'cancel' ? handleFriendPress :
                                                handleShowOptions
                                    }
                                >
                                    {displayStatus === 'unknown' ? (
                                        <ActivityIndicator size="small" color={darkMode ? '#94A3B8' : '#6B7280'} />
                                    ) : (
                                        <>
                                            <MaterialIcons name={config.icon as any} size={18} color={config.iconColor} />
                                            <Text style={[styles.primaryBtnText, { color: config.iconColor }]}>{config.label}</Text>
                                        </>
                                    )}
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: darkMode ? '#334155' : '#F1F5F9', transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                                    onPress={handleMessages}
                                >
                                    <MaterialIcons name="chat" size={18} color={theme.textMuted} />
                                    <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Nhắn tin</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    profile_container: {
        position: "relative",
        marginBottom: 16,
    },
    cover: {
        width: "100%",
        height: 140,
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    avatar_large: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        marginTop: -80,
        marginLeft: -6
    },
    infoContainer: {
        marginTop: 10,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameText: {
        fontSize: 26,
        fontWeight: "700",
    },
    verifiedBadge: {
        marginLeft: 6,
        marginTop: 4,
    },
    majorSubtitle: {
        fontSize: 15,
        fontWeight: '500',
        marginTop: 2,
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        paddingVertical: 4,
    },
    statGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statCount: {
        fontSize: 16,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 14,
        marginLeft: 4,
        fontWeight: '500',
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        marginHorizontal: 10,
    },
    actionRow: {
        marginTop: 20,
    },
    dualButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    primaryBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    primaryBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    secondaryBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    secondaryBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
